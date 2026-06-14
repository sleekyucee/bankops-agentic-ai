from functools import lru_cache

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.rag.langchain_pipeline import (
    load_langchain_documents,
    split_langchain_documents,
)


EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_last_build_stats = {
    "indexed_documents": 0,
    "indexed_chunks": 0,
}


@lru_cache(maxsize=1)
def build_vector_store() -> FAISS:
    documents = load_langchain_documents()
    split_documents = split_langchain_documents(documents)
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    _last_build_stats["indexed_documents"] = len(documents)
    _last_build_stats["indexed_chunks"] = len(split_documents)

    return FAISS.from_documents(split_documents, embeddings)


def refresh_vector_store() -> dict:
    build_vector_store.cache_clear()
    build_vector_store()
    return dict(_last_build_stats)


def search_vector_store(query: str, top_k: int = 3) -> list[Document]:
    vector_store = build_vector_store()
    return vector_store.similarity_search(query, k=top_k)
