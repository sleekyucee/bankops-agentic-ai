from fastapi import APIRouter

from app.db.database import get_connection
from app.rag.loader import KNOWLEDGE_BASE_PATH


router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.get("/health/deep")
def deep_health_check():
    checks = {}

    try:
        with get_connection() as connection:
            connection.execute("SELECT 1").fetchone()
        checks["database"] = "ok"
    except Exception as error:
        checks["database"] = f"error: {error}"

    try:
        with get_connection() as connection:
            table = connection.execute(
                """
                SELECT name
                FROM sqlite_master
                WHERE type = 'table' AND name = 'customer_profiles'
                """
            ).fetchone()

        if table is None:
            raise RuntimeError("customer_profiles table does not exist")

        checks["customer_profiles_table"] = "ok"
    except Exception as error:
        checks["customer_profiles_table"] = f"error: {error}"

    try:
        if not KNOWLEDGE_BASE_PATH.is_dir():
            raise RuntimeError(
                f"knowledge base directory does not exist: {KNOWLEDGE_BASE_PATH}"
            )
        checks["knowledge_base"] = "ok"
    except Exception as error:
        checks["knowledge_base"] = f"error: {error}"

    try:
        from app.rag.vector_store import build_vector_store

        build_vector_store()
        checks["vector_store"] = "ok"
    except Exception as error:
        checks["vector_store"] = f"error: {error}"

    status = (
        "healthy"
        if all(check == "ok" for check in checks.values())
        else "degraded"
    )

    return {
        "status": status,
        "checks": checks,
    }
