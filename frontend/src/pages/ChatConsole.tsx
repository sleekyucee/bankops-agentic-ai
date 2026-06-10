import { AlertCircle, Bot, Send, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

import { sendMessage, type ChatResponse } from "../api/chatApi";

export function ChatConsole() {
  const [userId, setUserId] = useState("user_001");
  const [message, setMessage] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    const trimmedUserId = userId.trim();

    if (!trimmedMessage || !trimmedUserId) {
      setError("User ID and message are required.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const result = await sendMessage({
        user_id: trimmedUserId,
        message: trimmedMessage,
      });
      setSubmittedMessage(trimmedMessage);
      setResponse(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send the message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 p-5 sm:p-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
      <section className="min-w-0">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Customer conversation</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Send a request through the BankOps LangGraph workflow.
          </p>
        </div>

        <div className="flex min-h-[460px] flex-col overflow-hidden rounded-md border border-zinc-200 bg-white">
          <div className="flex-1 space-y-5 p-5 sm:p-6">
            {!response && (
              <div className="grid min-h-72 place-items-center text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid size-11 place-items-center rounded-md bg-zinc-100 text-zinc-500">
                    <Bot aria-hidden="true" size={22} />
                  </div>
                  <p className="mt-4 text-sm font-medium">
                    No conversation response yet
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Enter a customer message below to inspect the reply and
                    workflow metadata.
                  </p>
                </div>
              </div>
            )}

            {response && (
              <>
                <div className="flex justify-end">
                  <div className="max-w-[82%] rounded-md bg-zinc-900 px-4 py-3 text-sm leading-6 text-white">
                    {submittedMessage}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-800">
                    <Bot aria-hidden="true" size={17} />
                  </div>
                  <div className="max-w-[88%] rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-800">
                    {response.reply}
                  </div>
                </div>
              </>
            )}
          </div>

          <form
            className="border-t border-zinc-200 bg-zinc-50 p-4"
            onSubmit={handleSubmit}
          >
            {error && (
              <div
                className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={16}
                />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-3">
              <label
                className="mb-1.5 block text-xs font-medium text-zinc-600"
                htmlFor="chat-user-id"
              >
                Customer ID
              </label>
              <div className="relative">
                <UserRound
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  id="chat-user-id"
                  onChange={(event) => setUserId(event.target.value)}
                  value={userId}
                />
              </div>
            </div>

            <label
              className="mb-1.5 block text-xs font-medium text-zinc-600"
              htmlFor="chat-message"
            >
              Message
            </label>
            <div className="flex items-end gap-3">
              <textarea
                className="min-h-24 flex-1 resize-none rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                id="chat-message"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What happens when my card is frozen?"
                value={message}
              />
              <button
                className="grid size-10 shrink-0 place-items-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={isSending || !message.trim() || !userId.trim()}
                title="Send message"
                type="submit"
              >
                <Send aria-hidden="true" size={18} />
                <span className="sr-only">
                  {isSending ? "Sending message" : "Send message"}
                </span>
              </button>
            </div>
            {isSending && (
              <p className="mt-2 text-xs text-zinc-500">
                BankOps is processing the request...
              </p>
            )}
          </form>
        </div>
      </section>

      <aside className="min-w-0 border-t border-zinc-300 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
        <div>
          <h2 className="text-base font-semibold">Workflow result</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Intent, escalation, and orchestration metadata.
          </p>
        </div>

        <dl className="mt-5 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          <ResultRow label="Intent" value={response?.intent} />
          <ResultRow label="Ticket ID" value={response?.ticket_id} />
          <ResultRow label="Assigned team" value={response?.assigned_team} />
        </dl>

        <div className="mt-6">
          <h3 className="text-sm font-semibold">Decision trace</h3>
          {response?.decision_trace.length ? (
            <ol className="mt-3 space-y-2">
              {response.decision_trace.map((entry, index) => (
                <li
                  className="flex gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm"
                  key={`${entry}-${index}`}
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs text-zinc-600">
                    {index + 1}
                  </span>
                  <span className="min-w-0 break-words text-zinc-700">
                    {entry}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-3 rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
              Decision trace will appear after a response.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ResultRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 px-4 py-3 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-zinc-900">
        {value || "--"}
      </dd>
    </div>
  );
}
