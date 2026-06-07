from pathlib import Path

from langchain_community.document_loaders import TextLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


KNOWLEDGE_BASE_PATH = Path(__file__).resolve().parents[2] / "knowledge_base"


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
