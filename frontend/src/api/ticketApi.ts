import { apiClient } from "./client";

export interface SupportTicket {
  ticket_id: string;
  user_id: string;
  issue_type: string;
  priority: string;
  assigned_team: string;
  status: string;
  case_summary: string;
  created_at: string;
}

interface TicketListResponse {
  tickets: SupportTicket[];
}

export async function getSupportTickets(signal?: AbortSignal) {
  const response = await apiClient.get<TicketListResponse>("/debug/tickets", {
    signal,
  });

  return [...response.data.tickets].sort(
    (left, right) =>
      new Date(right.created_at).getTime() -
      new Date(left.created_at).getTime(),
  );
}
