import { apiClient } from "./client";

export interface MetricsSummary {
  total_events: number;
  total_chat_requests: number;
  intent_counts: Record<string, number>;
  tickets_created: number;
  rag_vector_used: number;
  rag_keyword_used: number;
  conversations_saved: number;
  crew_reviews_completed: number;
  crew_review_debug_calls: number;
}

export async function getMetricsSummary(signal?: AbortSignal) {
  const response = await apiClient.get<MetricsSummary>("/debug/metrics", {
    signal,
  });
  return response.data;
}
