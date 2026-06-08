import sqlite3
from pathlib import Path

from app.core.config import settings


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _resolve_project_path(path_value: str) -> Path:
    path = Path(path_value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


DATABASE_PATH = _resolve_project_path(settings.DATABASE_PATH)


def get_database_type() -> str:
    """Return the configured backend, which currently defaults to SQLite."""
    return settings.DATABASE_TYPE.lower()


def get_database_connection() -> sqlite3.Connection:
    """Return the current SQLite database connection.

    A future implementation may select and return a PostgreSQL connection
    here without requiring persistence callers to change.
    """
    database_type = get_database_type()

    if database_type != "sqlite":
        raise ValueError(f"Unsupported database type: {database_type}")

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection
