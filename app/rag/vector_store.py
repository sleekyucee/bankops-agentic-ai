from functools import lru_cache

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.rag.langchain_pipeline import (
    load_langchain_documents,
    split_langchain_documents,
)


EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def build_vector_store() -> FAISS:
    documents = load_langchain_documents()
    split_documents = split_langchain_documents(documents)
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

    return FAISS.from_documents(split_documents, embeddings)


def search_vector_store(query: str, top_k: int = 3) -> list[Document]:
    vector_store = build_vector_store()
    return vector_store.similarity_search(query, k=top_k)
