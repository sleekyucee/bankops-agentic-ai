import {
  AlertCircle,
  CalendarClock,
  RefreshCw,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  getSupportTickets,
  type SupportTicket,
} from "../api/ticketApi";

const priorityStyles: Record<string, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusStyles: Record<string, string> = {
  open: "border-blue-200 bg-blue-50 text-blue-700",
  "in review": "border-violet-200 bg-violet-50 text-violet-700",
  closed: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(status: string) {
  return formatLabel(status.toLowerCase());
}

function formatDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Badge({
  value,
  styles,
}: {
  value: string;
  styles: Record<string, string>;
}) {
  const normalizedValue = value.toLowerCase().replace(/_/g, " ");

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
        styles[normalizedValue] ??
        "border-zinc-200 bg-zinc-50 text-zinc-600"
      }`}
    >
      {formatLabel(normalizedValue)}
    </span>
  );
}

export function TicketQueue() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSupportTickets(signal);
      setTickets(result);
    } catch (requestError) {
      if (!signal?.aborted) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load support tickets.",
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
    void loadTickets(controller.signal);

    return () => controller.abort();
  }, [loadTickets]);

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Support ticket queue
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Escalations created by RUCA, ordered newest first.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadTickets()}
          disabled={isLoading}
          className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden="true"
            className={isLoading ? "animate-spin" : ""}
            size={16}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="mb-5 flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <div className="flex items-start gap-3 text-red-800">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            <div>
              <p className="text-sm font-semibold">Ticket queue unavailable</p>
              <p className="mt-1 text-xs text-red-700">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadTickets()}
            className="shrink-0 text-sm font-semibold text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="space-y-3 p-5" aria-label="Loading support tickets">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-md bg-zinc-100"
              />
            ))}
          </div>
        ) : tickets.length === 0 && !error ? (
          <div className="grid min-h-72 place-items-center px-5 py-12 text-center">
            <div>
              <TicketCheck
                aria-hidden="true"
                className="mx-auto text-zinc-300"
                size={34}
              />
              <p className="mt-4 text-sm font-semibold text-zinc-900">
                No support tickets
              </p>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Tickets will appear here when RUCA escalates a customer
                conversation.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Ticket ID</th>
                    <th className="px-5 py-3">Assigned team</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Created at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.ticket_id} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-zinc-900">
                        {ticket.ticket_id}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700">
                        {formatLabel(ticket.assigned_team)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          value={ticket.priority}
                          styles={priorityStyles}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          value={formatStatus(ticket.status)}
                          styles={statusStyles}
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-600">
                        {formatDate(ticket.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-200 md:hidden">
              {tickets.map((ticket) => (
                <article key={ticket.ticket_id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-500">
                        Ticket
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-950">
                        {ticket.ticket_id}
                      </p>
                    </div>
                    <Badge value={ticket.priority} styles={priorityStyles} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-zinc-700">
                    <UsersRound
                      aria-hidden="true"
                      className="shrink-0 text-zinc-400"
                      size={16}
                    />
                    {formatLabel(ticket.assigned_team)}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge
                      value={formatStatus(ticket.status)}
                      styles={statusStyles}
                    />
                    <span className="flex items-center gap-2 text-xs text-zinc-500">
                      <CalendarClock aria-hidden="true" size={15} />
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
