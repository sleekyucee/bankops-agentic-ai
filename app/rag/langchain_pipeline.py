from langchain_community.document_loaders import TextLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.rag.loader import get_indexable_knowledge_files


def load_langchain_documents() -> list[Document]:
    documents = []

    for file_path, category in get_indexable_knowledge_files():
        loaded_documents = TextLoader(
            str(file_path),
            encoding="utf-8",
        ).load()

        for document in loaded_documents:
            document.metadata["filename"] = file_path.name
            document.metadata["category"] = category
            documents.append(document)

    return documents


def split_langchain_documents(documents: list[Document]) -> list[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=100,
    )
    return text_splitter.split_documents(documents)
