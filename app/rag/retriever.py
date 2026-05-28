import re

from app.rag.loader import chunk_documents, load_knowledge_base


STOPWORDS = {
    "the",
    "is",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "my",
    "i",
}


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return {word for word in words if word not in STOPWORDS}


def retrieve_relevant_chunks(query: str, top_k: int = 3) -> list[dict]:
    query_words = _tokenize(query)

    if not query_words:
        return []

    documents = load_knowledge_base()
    chunks = chunk_documents(documents)
    scored_chunks = []

    for chunk in chunks:
        chunk_words = _tokenize(chunk["content"])
        score = len(query_words.intersection(chunk_words))

        if score > 0:
            scored_chunks.append(
                {
                    **chunk,
                    "score": score,
                }
            )

    scored_chunks.sort(key=lambda chunk: chunk["score"], reverse=True)
    return scored_chunks[:top_k]
