import { apiClient } from "./client";
import type { SupportTicket } from "./ticketApi";

interface CustomerContext {
  user_id: string;
  customer_name: string;
  card_status: string;
  account_risk_level: string;
  recent_contact_count: number;
}

export interface RecentConversation {
  message: string;
  intent: string;
  reply: string;
  created_at: string;
}

interface ConversationsResponse {
  user_id: string;
  conversations: RecentConversation[];
}

interface TicketsResponse {
  tickets: SupportTicket[];
}

export interface CustomerProfileData {
  userId: string;
  name: string;
  accountStatus: string;
  riskLevel: string;
  cardStatus: string;
  openTickets: number;
  recentConversations: RecentConversation[];
}

export async function getCustomerProfile(
  userId: string,
  signal?: AbortSignal,
): Promise<CustomerProfileData> {
  const encodedUserId = encodeURIComponent(userId);
  const [customerResponse, conversationsResponse, ticketsResponse] =
    await Promise.all([
      apiClient.get<CustomerContext>(`/debug/customer/${encodedUserId}`, {
        signal,
      }),
      apiClient.get<ConversationsResponse>(
        `/debug/conversations/${encodedUserId}`,
        { signal },
      ),
      apiClient.get<TicketsResponse>(`/debug/tickets/${encodedUserId}`, {
        signal,
      }),
    ]);

  const openTickets = ticketsResponse.data.tickets.filter(
    (ticket) => ticket.status.toLowerCase() !== "closed",
  ).length;

  return {
    userId: customerResponse.data.user_id,
    name: customerResponse.data.customer_name,
    accountStatus: "active",
    riskLevel: customerResponse.data.account_risk_level,
    cardStatus: customerResponse.data.card_status,
    openTickets,
    recentConversations: conversationsResponse.data.conversations,
  };
}
