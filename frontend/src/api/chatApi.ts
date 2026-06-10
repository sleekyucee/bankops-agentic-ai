import { apiClient } from "./client";

export interface ChatRequest {
  user_id: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  status: string;
  escalation_required: boolean;
  escalation_priority: string | null;
  assigned_team: string | null;
  intent: string;
  decision_trace: string[];
  ticket_id: string | null;
  case_summary: string | null;
  created_at: string | null;
  human_review_required: boolean;
  approval_status: string | null;
  review_queue: string | null;
}

export async function sendMessage(payload: ChatRequest) {
  const response = await apiClient.post<ChatResponse>("/chat", payload);
  return response.data;
}
