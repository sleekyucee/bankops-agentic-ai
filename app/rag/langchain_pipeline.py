from pathlib import Path

from langchain_community.document_loaders import TextLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _resolve_project_path(path_value: str) -> Path:
    path = Path(path_value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


KNOWLEDGE_BASE_PATH = _resolve_project_path(settings.KNOWLEDGE_BASE_PATH)


def load_langchain_documents() -> list[Document]:
    documents = []

    for file_path in sorted(KNOWLEDGE_BASE_PATH.glob("*.md")):
        loaded_documents = TextLoader(
            str(file_path),
            encoding="utf-8",
        ).load()

        for document in loaded_documents:
            document.metadata["filename"] = file_path.name
            documents.append(document)

    return documents


def split_langchain_documents(documents: list[Document]) -> list[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=100,
    )
    return text_splitter.split_documents(documents)
