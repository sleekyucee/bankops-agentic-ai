import {
  AlertCircle,
  BookOpen,
  FileText,
  RefreshCw,
  Upload,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  getKnowledgeDocuments,
  getKnowledgeBaseStatus,
  reindexKnowledgeBase,
  uploadKnowledgeDocument,
  type KnowledgeDocument,
  type KnowledgeBaseStatus,
} from "../api/knowledgeBaseApi";

const acceptedFileTypes = ".pdf,.docx,.txt,.md";

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function KnowledgeBase() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [reindexStatus, setReindexStatus] =
    useState<KnowledgeBaseStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocuments = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [loadedDocuments, loadedStatus] = await Promise.all([
        getKnowledgeDocuments(signal),
        getKnowledgeBaseStatus(signal),
      ]);
      setDocuments(loadedDocuments);
      setReindexStatus(loadedStatus);
    } catch (requestError) {
      if (!signal?.aborted) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load knowledge-base documents.",
        );
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadDocuments(controller.signal);
    return () => controller.abort();
  }, [loadDocuments]);

  const handleFileSelected = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadMessage(null);

    try {
      const uploadedDocument = await uploadKnowledgeDocument(file);
      setDocuments((current) => [
        uploadedDocument,
        ...current.filter(
          (document) => document.filename !== uploadedDocument.filename,
        ),
      ]);
      setUploadMessage(`${uploadedDocument.filename} uploaded successfully.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload the selected document.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    setError(null);
    setUploadMessage(null);

    try {
      const result = await reindexKnowledgeBase();
      setReindexStatus({
        vector_store_ready: result.status === "success",
        last_reindex_status: result.status,
        last_reindex_message: result.message,
        last_reindex_duration_seconds: result.duration_seconds,
      });

      if (result.status === "failed") {
        setError(result.message);
      } else {
        setUploadMessage(result.message);
        await loadDocuments();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to rebuild the vector store.",
      );
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl space-y-6 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Knowledge base
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Review support documents and refresh RUCA's local search index.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadDocuments()}
            disabled={isLoading}
            className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={isLoading ? "animate-spin" : ""}
              size={16}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleReindex()}
            disabled={isReindexing}
            className="flex h-9 items-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={isReindexing ? "animate-spin" : ""}
              size={16}
            />
            {isReindexing ? "Reindexing..." : "Reindex"}
          </button>
        </div>
      </div>

      <section className="rounded-md border border-zinc-200 bg-white p-5">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-800">
              <Upload aria-hidden="true" size={19} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                Upload document
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Markdown and TXT can be indexed. PDF and DOCX remain pending
                parser support.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={(event) => void handleFileSelected(event)}
            className="sr-only"
            aria-label="Upload knowledge-base document"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Upload aria-hidden="true" size={16} />
            {isUploading ? "Uploading..." : "Choose file"}
          </button>
        </div>
        {uploadMessage && (
          <p className="mt-4 border-t border-zinc-200 pt-4 text-sm text-emerald-700">
            {uploadMessage}
          </p>
        )}
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              Vector store status
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Latest in-memory FAISS rebuild result.
            </p>
          </div>
          <span
            className={`rounded-md border px-2 py-1 text-xs font-semibold ${
              reindexStatus?.last_reindex_status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : reindexStatus?.last_reindex_status === "failed"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
            }`}
          >
            {reindexStatus?.last_reindex_status.replace(/_/g, " ") ??
              "Loading"}
          </span>
        </div>
        <p className="mt-4 text-sm text-zinc-700">
          {reindexStatus?.last_reindex_message ??
            "Loading vector-store status..."}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Duration:{" "}
          {reindexStatus?.last_reindex_duration_seconds == null
            ? "Not available"
            : `${reindexStatus.last_reindex_duration_seconds.toFixed(3)} seconds`}
        </p>
      </section>

      {error && (
        <div
          className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800"
          role="alert"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={18}
          />
          <div>
            <p className="text-sm font-semibold">Knowledge base unavailable</p>
            <p className="mt-1 text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-950">Documents</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Built-in articles and locally uploaded files.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-md bg-zinc-100"
              />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-5 py-10 text-center">
            <div>
              <BookOpen
                aria-hidden="true"
                className="mx-auto text-zinc-300"
                size={34}
              />
              <p className="mt-4 text-sm font-semibold text-zinc-900">
                No knowledge documents
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Upload a supported file to start the local document library.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {documents.map((document) => (
              <article
                key={`${document.source}-${document.filename}`}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600">
                    <FileText aria-hidden="true" size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-950">
                      {document.filename}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {document.file_type.toUpperCase()} -{" "}
                      {formatFileSize(document.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pl-12 sm:justify-end sm:pl-0">
                  <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600">
                    {document.category === "uploaded"
                      ? "Uploaded"
                      : "Built in"}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium ${
                      document.indexed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {document.indexed ? "Indexed" : "Pending parser"}
                  </span>
                  <span className="whitespace-nowrap text-xs text-zinc-500">
                    {formatDate(document.uploaded_at)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
