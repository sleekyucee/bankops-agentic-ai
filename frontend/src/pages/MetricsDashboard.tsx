import { AlertCircle, BarChart3 } from "lucide-react";

import type { MetricsSummary } from "../api/metricsApi";

interface MetricsDashboardProps {
  metrics: MetricsSummary | null;
  isLoading: boolean;
  error: string | null;
}

export function MetricsDashboard({
  metrics,
  isLoading,
  error,
}: MetricsDashboardProps) {
  const metricsList: Array<{ label: string; value: number | undefined }> = [
    { label: "Total events", value: metrics?.total_events },
    { label: "Chat requests", value: metrics?.total_chat_requests },
    { label: "Tickets created", value: metrics?.tickets_created },
    { label: "Vector RAG used", value: metrics?.rag_vector_used },
    { label: "Keyword RAG used", value: metrics?.rag_keyword_used },
    { label: "Conversations saved", value: metrics?.conversations_saved },
    { label: "Crew reviews", value: metrics?.crew_reviews_completed },
    { label: "Crew debug calls", value: metrics?.crew_review_debug_calls },
  ];

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl space-y-7 p-5 sm:p-8">
      <div>
        <h2 className="text-base font-semibold text-zinc-950">
          Management metrics
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Detailed activity and workflow usage across BankOps.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={18}
          />
          <div>
            <p className="text-sm font-semibold">Metrics unavailable</p>
            <p className="mt-1 text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricsList.map(({ label, value }) => (
          <article
            key={label}
            className="rounded-md border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-600">{label}</p>
              <BarChart3 aria-hidden="true" size={17} className="text-zinc-400" />
            </div>
            <p
              className={`mt-4 text-2xl font-semibold text-zinc-950 ${
                isLoading ? "animate-pulse text-zinc-300" : ""
              }`}
            >
              {isLoading ? "..." : (value ?? "--")}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-950">Intent counts</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Persisted chat activity grouped by classified intent.
          </p>
        </div>
        {metrics && Object.keys(metrics.intent_counts).length > 0 ? (
          <div className="divide-y divide-zinc-200">
            {Object.entries(metrics.intent_counts).map(([intent, count]) => (
              <div
                key={intent}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <span className="text-sm font-medium capitalize text-zinc-700">
                  {intent.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-semibold text-zinc-950">
                  {count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">
            {isLoading ? "Loading intent metrics..." : "No intent data yet."}
          </p>
        )}
      </section>
    </div>
  );
}
