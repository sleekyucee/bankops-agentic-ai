import logging
from concurrent.futures import Future, ThreadPoolExecutor, TimeoutError
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from time import perf_counter
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.rag.loader import (
    INDEXABLE_EXTENSIONS,
    KNOWLEDGE_BASE_PATH,
    UPLOADS_PATH,
    get_indexable_knowledge_files,
)


router = APIRouter(prefix="/debug/knowledge-base", tags=["debug"])

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
REINDEX_TIMEOUT_SECONDS = 120
logger = logging.getLogger(__name__)
_reindex_executor = ThreadPoolExecutor(
    max_workers=1,
    thread_name_prefix="knowledge-base-reindex",
)
_reindex_lock = RLock()
_active_reindex: Future | None = None
_reindex_status = {
    "vector_store_ready": False,
    "last_reindex_status": "not_run",
    "last_reindex_message": "Knowledge base has not been reindexed yet.",
    "last_reindex_duration_seconds": None,
}


def _document_details(file_path: Path, source: str) -> dict:
    stat = file_path.stat()
    indexed = file_path.suffix.lower() in INDEXABLE_EXTENSIONS
    return {
        "filename": file_path.name,
        "path": file_path.relative_to(KNOWLEDGE_BASE_PATH).as_posix(),
        "category": source,
        "file_type": file_path.suffix.lower().lstrip("."),
        "size_bytes": stat.st_size,
        "source": source,
        "indexed": indexed,
        "reason": None if indexed else "pending_parser_support",
        "uploaded_at": datetime.fromtimestamp(
            stat.st_mtime,
            tz=timezone.utc,
        ).isoformat(),
    }


@router.get("")
def list_knowledge_base_documents():
    KNOWLEDGE_BASE_PATH.mkdir(parents=True, exist_ok=True)
    built_in_documents = [
        _document_details(file_path, "built_in")
        for file_path in KNOWLEDGE_BASE_PATH.iterdir()
        if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    uploaded_documents = []
    if UPLOADS_PATH.exists():
        uploaded_documents = [
            _document_details(file_path, "uploaded")
            for file_path in UPLOADS_PATH.iterdir()
            if file_path.is_file()
            and file_path.suffix.lower() in SUPPORTED_EXTENSIONS
        ]

    documents = sorted(
        built_in_documents + uploaded_documents,
        key=lambda document: document["uploaded_at"],
        reverse=True,
    )
    return {"documents": documents}


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_knowledge_base_document(file: UploadFile = File(...)):
    original_filename = Path(file.filename or "").name
    extension = Path(original_filename).suffix.lower()

    if not original_filename or extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported file types are PDF, DOCX, TXT, and MD.",
        )

    UPLOADS_PATH.mkdir(parents=True, exist_ok=True)
    destination = UPLOADS_PATH / original_filename

    if destination.exists():
        destination = (
            UPLOADS_PATH
            / f"{destination.stem}-{uuid4().hex[:8]}{destination.suffix}"
        )

    try:
        destination.write_bytes(await file.read())
    finally:
        await file.close()

    return {"document": _document_details(destination, "uploaded")}


@router.post("/reindex")
def reindex_knowledge_base():
    global _active_reindex

    started_at = perf_counter()
    indexable_files = get_indexable_knowledge_files()

    with _reindex_lock:
        if _active_reindex is not None and not _active_reindex.done():
            message = "A knowledge-base reindex is already running."
            _update_reindex_status(
                ready=_reindex_status["vector_store_ready"],
                status_value="failed",
                message=message,
                duration_seconds=0.0,
            )
            return _reindex_response(
                status_value="failed",
                indexed_documents=0,
                indexed_chunks=0,
                duration_seconds=0.0,
                message=message,
            )

        _active_reindex = _reindex_executor.submit(_rebuild_vector_store)
        active_reindex = _active_reindex
        active_reindex.reindex_started_at = started_at
        active_reindex.add_done_callback(_complete_timed_out_reindex)

    logger.info(
        "Starting knowledge-base reindex for %s documents",
        len(indexable_files),
    )

    try:
        build_stats = active_reindex.result(timeout=REINDEX_TIMEOUT_SECONDS)
        duration_seconds = round(perf_counter() - started_at, 3)
        message = (
            "Vector store rebuilt successfully with "
            f"{build_stats['indexed_chunks']} chunks."
        )
        _update_reindex_status(
            ready=True,
            status_value="success",
            message=message,
            duration_seconds=duration_seconds,
        )
        logger.info(
            "Knowledge-base reindex completed in %.3f seconds",
            duration_seconds,
        )
        return _reindex_response(
            status_value="success",
            indexed_documents=build_stats["indexed_documents"],
            indexed_chunks=build_stats["indexed_chunks"],
            duration_seconds=duration_seconds,
            message=message,
        )
    except TimeoutError:
        duration_seconds = round(perf_counter() - started_at, 3)
        message = (
            "Vector store rebuild exceeded "
            f"{REINDEX_TIMEOUT_SECONDS} seconds and is still finishing locally."
        )
        _update_reindex_status(
            ready=False,
            status_value="failed",
            message=message,
            duration_seconds=duration_seconds,
        )
        logger.warning(message)
        return _reindex_response(
            status_value="failed",
            indexed_documents=0,
            indexed_chunks=0,
            duration_seconds=duration_seconds,
            message=message,
        )
    except Exception as error:
        duration_seconds = round(perf_counter() - started_at, 3)
        message = f"Vector store rebuild failed: {error}"
        _update_reindex_status(
            ready=False,
            status_value="failed",
            message=message,
            duration_seconds=duration_seconds,
        )
        logger.exception("Knowledge-base reindex failed")
        return _reindex_response(
            status_value="failed",
            indexed_documents=0,
            indexed_chunks=0,
            duration_seconds=duration_seconds,
            message=message,
        )


@router.get("/status")
def get_knowledge_base_status():
    with _reindex_lock:
        return dict(_reindex_status)


def _rebuild_vector_store() -> dict:
    from app.rag.vector_store import refresh_vector_store

    return refresh_vector_store()


def _complete_timed_out_reindex(future: Future) -> None:
    if _reindex_status["last_reindex_status"] != "failed":
        return

    try:
        build_stats = future.result()
    except Exception:
        return

    message = (
        "Vector store finished rebuilding after the request timeout with "
        f"{build_stats['indexed_chunks']} chunks."
    )
    duration_seconds = round(
        perf_counter() - getattr(future, "reindex_started_at", perf_counter()),
        3,
    )
    _update_reindex_status(
        ready=True,
        status_value="success",
        message=message,
        duration_seconds=duration_seconds,
    )


def _update_reindex_status(
    *,
    ready: bool,
    status_value: str,
    message: str,
    duration_seconds: float | None,
) -> None:
    with _reindex_lock:
        _reindex_status.update(
            {
                "vector_store_ready": ready,
                "last_reindex_status": status_value,
                "last_reindex_message": message,
                "last_reindex_duration_seconds": duration_seconds,
            }
        )


def _reindex_response(
    *,
    status_value: str,
    indexed_documents: int,
    indexed_chunks: int,
    duration_seconds: float,
    message: str,
) -> dict:
    return {
        "status": status_value,
        "indexed_documents": indexed_documents,
        "indexed_chunks": indexed_chunks,
        "duration_seconds": duration_seconds,
        "message": message,
    }
