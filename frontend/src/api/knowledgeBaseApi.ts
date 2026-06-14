import { apiClient } from "./client";

export interface KnowledgeDocument {
  filename: string;
  path: string;
  category: "built_in" | "uploaded";
  file_type: string;
  size_bytes: number;
  source: "built_in" | "uploaded";
  indexed: boolean;
  reason: string | null;
  uploaded_at: string;
}

interface KnowledgeDocumentsResponse {
  documents: KnowledgeDocument[];
}

interface KnowledgeDocumentResponse {
  document: KnowledgeDocument;
}

export async function getKnowledgeDocuments(signal?: AbortSignal) {
  const response = await apiClient.get<KnowledgeDocumentsResponse>(
    "/debug/knowledge-base",
    { signal },
  );
  return response.data.documents;
}

export async function uploadKnowledgeDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<KnowledgeDocumentResponse>(
    "/debug/knowledge-base",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.document;
}

export interface ReindexResponse {
  status: "success" | "failed";
  indexed_documents: number;
  indexed_chunks: number;
  duration_seconds: number;
  message: string;
}

export interface KnowledgeBaseStatus {
  vector_store_ready: boolean;
  last_reindex_status: string;
  last_reindex_message: string;
  last_reindex_duration_seconds: number | null;
}

export async function reindexKnowledgeBase() {
  const response = await apiClient.post<ReindexResponse>(
    "/debug/knowledge-base/reindex",
    undefined,
    { timeout: 125_000 },
  );
  return response.data;
}

export async function getKnowledgeBaseStatus(signal?: AbortSignal) {
  const response = await apiClient.get<KnowledgeBaseStatus>(
    "/debug/knowledge-base/status",
    { signal },
  );
  return response.data;
}
