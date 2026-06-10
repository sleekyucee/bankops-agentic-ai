import {
  AlertCircle,
  Bot,
  Clock3,
  CreditCard,
  Headphones,
  ReceiptText,
  Send,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { sendMessage } from "../api/chatApi";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  ticketId?: string | null;
  assignedTeam?: string | null;
};

const suggestedPrompts = [
  { label: "Review my spending", icon: WalletCards },
  { label: "I don't recognise a transaction", icon: CreditCard },
  { label: "How long does a refund take?", icon: Clock3 },
  { label: "I need to speak to someone", icon: Headphones },
];

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi, I'm RUCA. I can help with spending, card concerns, refunds, and connecting you to our support team. What can I help you with today?",
  },
];

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatTeamName(team: string) {
  return team
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCustomerReply(reply: string) {
  const customerFacingReply = reply
    .replace(
      /use this article to answer customer questions about/gi,
      "Here is what you need to know about",
    )
    .replace(
      /use chargeback support when/gi,
      "You can use chargeback support when",
    )
    .replace(/advise the customer to/gi, "You should")
    .replace(/tell the customer to/gi, "You should")
    .replace(/tell the customer that/gi, "You should know that")
    .replace(/tell the customer/gi, "You should know")
    .replace(
      /review recent account activity with the customer/gi,
      "We may review your recent account activity with you",
    )
    .replace(/recommend that the customer/gi, "It may help if you")
    .replace(/recommend the customer to/gi, "It may help to")
    .replace(/\s+sources?:\s*[^\n]+$/i, "")
    .split("\n")
    .filter((line) => !/^\s*sources?:/i.test(line))
    .join("\n")
    .replace(/[ \t]+([,.!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!customerFacingReply) {
    return "I can help with that. Please share a little more detail.";
  }

  return (
    customerFacingReply.charAt(0).toUpperCase() + customerFacingReply.slice(1)
  );
}

export function CustomerChat() {
  const [userId, setUserId] = useState("user_001");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const submitMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: "user", content: trimmedMessage },
    ]);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const response = await sendMessage({
        user_id: userId.trim() || "user_001",
        message: trimmedMessage,
      });

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: formatCustomerReply(response.reply),
          ticketId: response.ticket_id,
          assignedTeam: response.assigned_team,
        },
      ]);
    } catch {
      setError(
        "RUCA could not reach support services. Check that the BankOps backend is running and try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(draft);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4f7f6]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex min-h-[calc(100vh-4rem)] flex-col border-x border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Bot size={21} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-950">RUCA</h2>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="truncate text-sm text-slate-500">
                  BankOps digital support
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <UserRound size={16} aria-hidden="true" />
              <span className="sr-only">Demo customer</span>
              <select
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                aria-label="Select demo customer"
              >
                <option value="user_001">user_001</option>
                <option value="user_002">user_002</option>
                <option value="user_003">user_003</option>
              </select>
            </label>
          </div>

          <div
            className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7"
            aria-live="polite"
          >
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2.5 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                      <Bot size={16} aria-hidden="true" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6 sm:max-w-[72%] ${
                      isAssistant
                        ? "border border-slate-200 bg-slate-50 text-slate-700"
                        : "bg-emerald-700 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {isAssistant && message.ticketId && (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <ReceiptText size={16} aria-hidden="true" />
                          Support case {message.ticketId}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {message.assignedTeam
                            ? `Assigned to ${formatTeamName(message.assignedTeam)}. A specialist will review your request.`
                            : "A support specialist will review your request."}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                      <UserRound size={16} aria-hidden="true" />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-end gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Bot size={16} aria-hidden="true" />
                </div>
                <div className="flex h-11 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
                  <span className="sr-only">RUCA is typing</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-7">
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle
                  className="mt-0.5 shrink-0"
                  size={16}
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 rounded-lg border border-slate-300 bg-white p-2 shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100"
            >
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message RUCA"
                rows={1}
                disabled={isSending}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                aria-label="Message RUCA"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Send message"
                title="Send message"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-slate-400">
              RUCA may ask a support specialist to review sensitive requests.
            </p>
          </div>
        </section>

        <aside className="hidden border-r border-slate-200 bg-[#f4f7f6] px-5 py-7 lg:block">
          <div className="mb-6 flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-emerald-700"
              size={20}
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                How can we help?
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Choose a common request or write your own message.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {suggestedPrompts.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => void submitMessage(label)}
                disabled={isSending}
                className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon
                  className="shrink-0 text-emerald-700"
                  size={17}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1">
          {suggestedPrompts.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => void submitMessage(label)}
              disabled={isSending}
              className="flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
