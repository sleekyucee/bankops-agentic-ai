from pathlib import Path


KNOWLEDGE_BASE_PATH = Path(__file__).resolve().parents[2] / "knowledge_base"


def load_knowledge_base() -> list[dict]:
    documents = []

    for file_path in sorted(KNOWLEDGE_BASE_PATH.glob("*.md")):
        documents.append(
            {
                "filename": file_path.name,
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
