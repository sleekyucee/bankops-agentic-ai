from pathlib import Path

from app.core.config import settings

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _resolve_project_path(path_value: str) -> Path:
    path = Path(path_value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


KNOWLEDGE_BASE_PATH = _resolve_project_path(settings.KNOWLEDGE_BASE_PATH)
UPLOADS_PATH = KNOWLEDGE_BASE_PATH / "uploads"
INDEXABLE_EXTENSIONS = {".md", ".txt"}


def get_indexable_knowledge_files() -> list[tuple[Path, str]]:
    files = []
    if KNOWLEDGE_BASE_PATH.exists():
        files = [
            (file_path, "built_in")
            for file_path in KNOWLEDGE_BASE_PATH.iterdir()
            if file_path.is_file()
            and file_path.suffix.lower() in INDEXABLE_EXTENSIONS
        ]

    if UPLOADS_PATH.exists():
        files.extend(
            (file_path, "uploaded")
            for file_path in UPLOADS_PATH.iterdir()
            if file_path.is_file()
            and file_path.suffix.lower() in INDEXABLE_EXTENSIONS
        )

    return sorted(files, key=lambda item: (item[1], item[0].name.lower()))


def load_knowledge_base() -> list[dict]:
    documents = []

    for file_path, category in get_indexable_knowledge_files():
        documents.append(
            {
                "filename": file_path.name,
                "category": category,
                "content": file_path.read_text(encoding="utf-8"),
            }
        )

    return documents


def chunk_documents(
    documents: list[dict],
    chunk_size: int = 700,
    overlap: int = 100,
) -> list[dict]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0")

    if overlap < 0:
        raise ValueError("overlap must be greater than or equal to 0")

    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    chunks = []

    for document in documents:
        filename = document["filename"]
        content = document.get("content", "")
        start = 0
        chunk_index = 0

        while start < len(content):
            end = start + chunk_size
            chunk_content = content[start:end].strip()

            if chunk_content:
                chunks.append(
                    {
                        "filename": filename,
                        "chunk_index": chunk_index,
                        "content": chunk_content,
                    }
                )
                chunk_index += 1

            start += chunk_size - overlap

    return chunks
