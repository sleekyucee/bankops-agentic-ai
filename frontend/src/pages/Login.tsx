import {
  BarChart3,
  Headphones,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useState, type FormEvent } from "react";

export type UserRole = "customer" | "support_agent" | "manager";

const roles = [
  {
    value: "customer" as const,
    label: "Customer",
    description: "Chat with RUCA for banking support.",
    icon: MessageCircle,
  },
  {
    value: "support_agent" as const,
    label: "Support Agent",
    description: "Review operations, chats, tickets, and customers.",
    icon: Headphones,
  },
  {
    value: "manager" as const,
    label: "Manager",
    description: "Access operations tools and management metrics.",
    icon: BarChart3,
  },
];

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(selectedRole);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-emerald-600 text-zinc-950">
            <ShieldCheck aria-hidden="true" size={25} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-950">
            BankOps RUCA
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Select a demo role to enter the product.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <fieldset>
            <legend className="text-sm font-semibold text-zinc-900">
              Continue as
            </legend>
            <div className="mt-4 space-y-3">
              {roles.map(({ value, label, description, icon: Icon }) => {
                const isSelected = selectedRole === value;

                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={isSelected}
                      onChange={() => setSelectedRole(value)}
                      className="sr-only"
                    />
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
                        isSelected
                          ? "bg-emerald-700 text-white"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      <Icon aria-hidden="true" size={18} />
                    </div>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-zinc-950">
                        {label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-500">
                        {description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            className="mt-5 h-11 w-full rounded-md bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Sign in
          </button>
          <p className="mt-3 text-center text-xs text-zinc-400">
            Demo access only. No password is required.
          </p>
        </form>
      </div>
    </main>
  );
}
