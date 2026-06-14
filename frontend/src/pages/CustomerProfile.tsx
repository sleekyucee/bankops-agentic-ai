import {
  AlertCircle,
  CalendarClock,
  CircleUserRound,
  CreditCard,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  TicketCheck,
  UserCheck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  getCustomerProfile,
  type CustomerProfileData,
} from "../api/customerApi";

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="border-t border-zinc-200 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

interface CustomerProfileProps {
  initialUserId?: string;
}

export function CustomerProfile({
  initialUserId = "user_001",
}: CustomerProfileProps) {
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [requestedUserId, setRequestedUserId] = useState(initialUserId);
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (userId: string, signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getCustomerProfile(userId, signal);
        setProfile(result);
      } catch (requestError) {
        if (!signal?.aborted) {
          setProfile(null);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load customer profile.",
          );
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadProfile(requestedUserId, controller.signal);

    return () => controller.abort();
  }, [loadProfile, requestedUserId]);

  useEffect(() => {
    setSelectedUserId(initialUserId);
    setRequestedUserId(initialUserId);
  }, [initialUserId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUserId = selectedUserId.trim();

    if (normalizedUserId) {
      setRequestedUserId(normalizedUserId);
    }
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Customer profile
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Inspect customer context, open tickets, and recent conversations.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full gap-2 sm:w-auto"
        >
          <label className="min-w-0 flex-1 sm:w-56">
            <span className="sr-only">Customer ID</span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              aria-label="Select customer ID"
            >
              <option value="user_001">user_001</option>
              <option value="user_002">user_002</option>
              <option value="user_003">user_003</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={isLoading ? "animate-spin" : ""}
              size={16}
            />
            Load
          </button>
        </form>
      </div>

      {error && (
        <div
          className="mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800"
          role="alert"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={18}
          />
          <div>
            <p className="text-sm font-semibold">Customer profile unavailable</p>
            <p className="mt-1 text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-md bg-zinc-200" />
          <div className="h-96 animate-pulse rounded-md bg-zinc-200" />
        </div>
      ) : profile ? (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <div className="mb-5 flex items-center gap-3 border-b border-zinc-200 pb-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                <CircleUserRound aria-hidden="true" size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-zinc-950">
                  {profile.name}
                </h3>
                <p className="text-sm text-zinc-500">{profile.userId}</p>
              </div>
            </div>

            <SummaryItem
              label="User ID"
              value={profile.userId}
              icon={<CircleUserRound aria-hidden="true" size={15} />}
            />
            <SummaryItem
              label="Account status"
              value={formatLabel(profile.accountStatus)}
              icon={<UserCheck aria-hidden="true" size={15} />}
            />
            <SummaryItem
              label="Risk level"
              value={formatLabel(profile.riskLevel)}
              icon={<ShieldAlert aria-hidden="true" size={15} />}
            />
            <SummaryItem
              label="Card status"
              value={formatLabel(profile.cardStatus)}
              icon={<CreditCard aria-hidden="true" size={15} />}
            />
            <SummaryItem
              label="Open tickets"
              value={profile.openTickets}
              icon={<TicketCheck aria-hidden="true" size={15} />}
            />
          </section>

          <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-zinc-950">
                Recent conversations
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Most recent persisted interactions for this customer.
              </p>
            </div>

            {profile.recentConversations.length === 0 ? (
              <div className="grid min-h-72 place-items-center px-5 py-12 text-center">
                <div>
                  <MessageSquareText
                    aria-hidden="true"
                    className="mx-auto text-zinc-300"
                    size={34}
                  />
                  <p className="mt-4 text-sm font-semibold text-zinc-900">
                    No recent conversations
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Customer interactions will appear here after using RUCA.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200">
                {profile.recentConversations.map((conversation, index) => (
                  <article
                    key={`${conversation.created_at}-${index}`}
                    className="p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="max-w-2xl text-sm leading-6 text-zinc-800">
                        {conversation.message}
                      </p>
                      <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600">
                        {formatLabel(conversation.intent)}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <CalendarClock aria-hidden="true" size={14} />
                      {formatDate(conversation.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-md border border-zinc-200 bg-white px-5 py-12 text-center">
          <div>
            <CircleUserRound
              aria-hidden="true"
              className="mx-auto text-zinc-300"
              size={34}
            />
            <p className="mt-4 text-sm font-semibold text-zinc-900">
              No customer selected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
