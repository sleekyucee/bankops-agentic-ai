import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Bot,
  CircleUserRound,
  Gauge,
  LogOut,
  MessageCircle,
  ShieldCheck,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  getMetricsSummary,
  type MetricsSummary,
} from "./api/metricsApi";
import { ChatConsole } from "./pages/ChatConsole";
import { CustomerChat } from "./pages/CustomerChat";
import { CustomerProfile } from "./pages/CustomerProfile";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { Login, type UserRole } from "./pages/Login";
import { MetricsDashboard } from "./pages/MetricsDashboard";
import { TicketQueue } from "./pages/TicketQueue";

type Page =
  | "Customer Chat"
  | "Operations Overview"
  | "Operations Chat"
  | "Ticket Queue"
  | "Customer Profile"
  | "Metrics Dashboard"
  | "Knowledge Base";

type NavigationItem = {
  label: Page;
  description: string;
  icon: LucideIcon;
};

const customerNavigation: NavigationItem[] = [
  {
    label: "Customer Chat",
    description: "Customer-facing RUCA assistant",
    icon: MessageCircle,
  },
];

const operationsNavigation: NavigationItem[] = [
  {
    label: "Operations Overview",
    description: "Internal metrics dashboard",
    icon: Gauge,
  },
  {
    label: "Operations Chat",
    description: "Internal debug and support console",
    icon: Bot,
  },
  {
    label: "Ticket Queue",
    description: "RUCA escalation tickets",
    icon: TicketCheck,
  },
  {
    label: "Customer Profile",
    description: "Customer context and history",
    icon: CircleUserRound,
  },
];

const managerNavigation: NavigationItem[] = [
  {
    label: "Metrics Dashboard",
    description: "Management activity metrics",
    icon: BarChart3,
  },
  {
    label: "Knowledge Base",
    description: "Manage support documents",
    icon: BookOpen,
  },
];

const AUTH_STORAGE_KEY = "bankops_demo_role";

function getStoredRole(): UserRole | null {
  const storedRole = localStorage.getItem(AUTH_STORAGE_KEY);

  if (
    storedRole === "customer" ||
    storedRole === "support_agent" ||
    storedRole === "manager"
  ) {
    return storedRole;
  }

  return null;
}

function getInitialPage(): Page {
  const storedRole = getStoredRole();
  return storedRole === "support_agent" || storedRole === "manager"
    ? "Operations Overview"
    : "Customer Chat";
}

function App() {
  const [role, setRole] = useState<UserRole | null>(getStoredRole);
  const [activePage, setActivePage] = useState<Page>(getInitialPage);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetrics() {
      try {
        const summary = await getMetricsSummary(controller.signal);
        setMetrics(summary);
        setMetricsError(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setMetricsError(
            error instanceof Error
              ? error.message
              : "Unable to load backend metrics.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingMetrics(false);
        }
      }
    }

    void loadMetrics();

    return () => controller.abort();
  }, []);

  const metricCards = [
    {
      label: "Chat requests",
      value: metrics?.total_chat_requests,
      detail: "Requests received by /chat",
    },
    {
      label: "Tickets created",
      value: metrics?.tickets_created,
      detail: "Persisted escalation tickets",
    },
    {
      label: "Vector RAG used",
      value: metrics?.rag_vector_used,
      detail: "FAISS retrieval selections",
    },
    {
      label: "Crew reviews",
      value: metrics?.crew_reviews_completed,
      detail: "Completed escalation reviews",
    },
    {
      label: "Conversations saved",
      value: metrics?.conversations_saved,
      detail: "Persisted chat interactions",
    },
  ];

  const handleLogin = (selectedRole: UserRole) => {
    localStorage.setItem(AUTH_STORAGE_KEY, selectedRole);
    setRole(selectedRole);
    setActivePage(
      selectedRole === "customer" ? "Customer Chat" : "Operations Overview",
    );
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setRole(null);
    setActivePage("Customer Chat");
  };

  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

  const isCustomer = role === "customer";
  const navigation =
    role === "customer"
      ? customerNavigation
      : role === "manager"
        ? [...operationsNavigation, ...managerNavigation]
        : operationsNavigation;

  const roleLabel =
    role === "support_agent"
      ? "Support Agent"
      : role === "manager"
        ? "Manager"
        : "Customer";

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-800 bg-zinc-950 text-zinc-100 lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-5">
          <div className="grid size-9 place-items-center rounded-md bg-emerald-500 text-zinc-950">
            <ShieldCheck aria-hidden="true" size={20} strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-sm font-semibold">BankOps RUCA</p>
            <p className="text-xs text-zinc-400">{roleLabel}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5" aria-label="Primary">
          {isCustomer ? (
            <>
              <p className="px-3 text-xs font-medium uppercase text-zinc-500">
                Customer
              </p>
              <div className="mt-2 space-y-1">
                {customerNavigation.map(
                  ({ label, description, icon: Icon }) => (
                    <button
                      className={`flex min-h-14 w-full items-center gap-3 rounded-md px-3 py-2 text-left ${
                        activePage === label
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                      }`}
                      key={label}
                      onClick={() => setActivePage(label)}
                      type="button"
                    >
                      <Icon
                        aria-hidden="true"
                        className="shrink-0"
                        size={18}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {label}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {description}
                        </span>
                      </span>
                    </button>
                  ),
                )}
              </div>
            </>
          ) : (
            <>
              <p className="px-3 text-xs font-medium uppercase text-zinc-500">
                Internal Operations
              </p>
              <div className="mt-2 space-y-1">
                {operationsNavigation.map(({ label, description, icon: Icon }) => (
                  <button
                    className={`flex min-h-14 w-full items-center gap-3 rounded-md px-3 py-2 text-left ${
                      activePage === label
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    }`}
                    key={label}
                    onClick={() => setActivePage(label)}
                    type="button"
                  >
                    <Icon
                      aria-hidden="true"
                      className="shrink-0"
                      size={18}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              {role === "manager" && (
                <>
                  <p className="mt-7 px-3 text-xs font-medium uppercase text-zinc-500">
                    Manager
                  </p>
                  <div className="mt-2 space-y-1">
                    {managerNavigation.map(
                      ({ label, description, icon: Icon }) => (
                        <button
                          className={`flex min-h-14 w-full items-center gap-3 rounded-md px-3 py-2 text-left ${
                            activePage === label
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                          }`}
                          key={label}
                          onClick={() => setActivePage(label)}
                          type="button"
                        >
                          <Icon
                            aria-hidden="true"
                            className="shrink-0"
                            size={18}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              {label}
                            </span>
                            <span className="block truncate text-xs text-zinc-500">
                              {description}
                            </span>
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            <LogOut aria-hidden="true" size={17} />
            Logout
          </button>
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5 sm:px-8">
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">
              {isCustomer ? "Customer support" : `Internal ${roleLabel}`}
            </p>
            <h1 className="text-lg font-semibold">{activePage}</h1>
          </div>
          <div className="flex items-center gap-3">
            {isCustomer ? (
              <div className="hidden items-center gap-2 text-sm text-zinc-600 sm:flex">
                <ShieldCheck
                  aria-hidden="true"
                  className="text-emerald-700"
                  size={16}
                />
                Secure support session
              </div>
            ) : (
              <div className="hidden items-center gap-2 text-sm text-zinc-600 sm:flex">
                <span
                  className={`size-2 rounded-full ${
                    metricsError ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
                {metricsError ? "Backend unavailable" : "Metrics connected"}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 lg:hidden"
              aria-label="Logout"
            >
              <LogOut aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-3 py-2 lg:hidden"
          aria-label="Product sections"
        >
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActivePage(label)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium ${
                activePage === label
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Icon aria-hidden="true" size={16} />
              {label}
            </button>
          ))}
        </nav>

        {activePage === "Customer Chat" && <CustomerChat />}

        {activePage === "Operations Chat" && (
          <div className="min-h-[calc(100vh-4rem)]">
            <ChatConsole />
          </div>
        )}

        {activePage === "Ticket Queue" && <TicketQueue />}

        {activePage === "Customer Profile" && <CustomerProfile />}

        {activePage === "Metrics Dashboard" && (
          <MetricsDashboard
            metrics={metrics}
            isLoading={isLoadingMetrics}
            error={metricsError}
          />
        )}

        {activePage === "Knowledge Base" && role === "manager" && (
          <KnowledgeBase />
        )}

        {activePage === "Operations Overview" && (
          <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Operational summary</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Live observability metrics from the BankOps backend.
                </p>
              </div>
            </div>

            {metricsError && (
              <div
                className="mb-4 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-900"
                role="alert"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium">Metrics unavailable</p>
                  <p className="mt-1 text-xs text-red-700">{metricsError}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {metricCards.map((metric) => (
                <article
                  className="rounded-md border border-zinc-200 bg-white p-5"
                  key={metric.label}
                >
                  <p className="text-sm text-zinc-600">{metric.label}</p>
                  <p
                    className={`mt-3 text-2xl font-semibold ${
                      isLoadingMetrics ? "animate-pulse text-zinc-300" : ""
                    }`}
                  >
                    {isLoadingMetrics ? "..." : (metric.value ?? "--")}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">{metric.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="border-t border-zinc-300 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Priority tickets</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Ticket data will appear after API integration.
                  </p>
                </div>
                <TicketCheck aria-hidden="true" className="text-zinc-400" size={20} />
              </div>
              <div className="mt-5 overflow-hidden rounded-md border border-zinc-200 bg-white">
                <div className="grid grid-cols-[1fr_1fr_110px] border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase text-zinc-500">
                  <span>Ticket</span>
                  <span>Assigned team</span>
                  <span>Priority</span>
                </div>
                <div className="grid min-h-40 place-items-center px-4 py-8 text-center">
                  <div>
                    <TicketCheck
                      aria-hidden="true"
                      className="mx-auto text-zinc-300"
                      size={28}
                    />
                    <p className="mt-3 text-sm font-medium">No ticket data</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Backend connectivity is intentionally deferred.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-300 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Knowledge services</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Retrieval capabilities planned for this console.
                  </p>
                </div>
                <BookOpen aria-hidden="true" className="text-zinc-400" size={20} />
              </div>
              <div className="mt-5 space-y-3">
                {["Keyword retrieval", "FAISS vector search", "Source inspection"].map(
                  (item) => (
                    <div
                      className="flex h-12 items-center justify-between rounded-md border border-zinc-200 bg-white px-4"
                      key={item}
                    >
                      <span className="text-sm">{item}</span>
                      <span className="text-xs text-zinc-500">Not connected</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
