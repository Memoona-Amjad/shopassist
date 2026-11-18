import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import type { UIMessage } from "ai";
import { isAdmin } from "@/lib/admin-auth";
import { CORE_POLICIES, getDashboardData, type ConversationRow } from "@/lib/admin-data";
import { ToolChip } from "@/components/chat/ToolChip";
import type { ToolPartLike } from "@/lib/agent/chip-labels";
import { LoginForm, ResetDemoButton, UploadForm } from "./forms";
import { deletePolicy, logout, resolveEscalation } from "./actions";

export const metadata: Metadata = { title: "Owner dashboard · ShopAssist" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const TOOL_ICONS: Record<string, string> = {
  searchPolicies: "📄", searchProducts: "🛍️", getOrderStatus: "🔎", startReturn: "↩️", escalateToHuman: "🧑",
};

// The page shell is static; everything that needs the login cookie or live data
// streams in inside <Suspense> (required by Next.js Cache Components).
export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-serif text-xl text-[var(--brand)]">Lawn &amp; Loom</Link>
            <span className="text-sm text-stone-500">Owner dashboard · ShopAssist</span>
          </div>
          <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">← Back to store</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Suspense fallback={<p className="text-sm text-stone-500">Loading dashboard…</p>}>
          <AdminContent />
        </Suspense>
      </main>
    </div>
  );
}

async function AdminContent() {
  if (!(await isAdmin())) return <LoginForm />;

  let data: Awaited<ReturnType<typeof getDashboardData>>;
  try {
    data = await getDashboardData();
  } catch (error) {
    console.error("Dashboard load failed:", error);
    return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Could not load the dashboard data. Please refresh in a moment.</p>;
  }
  const host = (await headers()).get("host") ?? "your-site.vercel.app";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const maxTool = Math.max(1, ...data.toolUsage.map(([, n]) => n));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-stone-900">Overview</h1>
        <div className="flex items-center gap-3">
          <ResetDemoButton />
          <form action={logout}>
            <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800">Log out</button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Conversations" value={data.stats.conversations} />
        <Stat label="Tool calls" value={data.stats.toolCalls} />
        <Stat label="Orders placed on the site" value={data.stats.ordersPlaced} />
        <Stat label="Returns started" value={data.stats.returnsStarted} />
        <Stat label="Open escalations" value={data.stats.openEscalations} highlight={data.stats.openEscalations > 0} />
        <Stat label="Chats sent to a human" value={`${data.stats.escalationRate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Escalations */}
        <Card title="🧑 Escalations" subtitle="Chats the agent handed to a human, with its summary">
          {data.escalations.length === 0 && <Empty>No escalations yet.</Empty>}
          <ul className="divide-y divide-stone-100">
            {data.escalations.slice(0, 12).map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-mono font-semibold text-stone-700">ESC-{e.id}</span>
                    <span>{when(e.created_at)}</span>
                    {e.reason && <span className="rounded bg-stone-100 px-1.5 py-0.5">{e.reason.replace(/_/g, " ")}</span>}
                  </div>
                  <p className="mt-1 text-sm text-stone-800">{e.summary}</p>
                </div>
                {e.status === "open" ? (
                  <form action={resolveEscalation}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="whitespace-nowrap rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800 hover:bg-orange-100">
                      Open · mark resolved
                    </button>
                  </form>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Resolved</span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          {/* Tool usage */}
          <Card title="🛠️ Tool usage" subtitle="Across the latest 40 conversations">
            {data.toolUsage.length === 0 && <Empty>No tool calls yet.</Empty>}
            <div className="space-y-2">
              {data.toolUsage.map(([name, count]) => (
                <div key={name} className="text-xs">
                  <div className="mb-0.5 flex justify-between text-stone-600">
                    <span>{TOOL_ICONS[name] ?? "🛠️"} <span className="font-mono">{name}</span></span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${(count / maxTool) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Orders placed on the store page */}
          <Card title="🛒 Orders placed on the site" subtitle="Cash on delivery · cleared by the nightly demo reset">
            {data.siteOrders.length === 0 && <Empty>No orders yet. Click a product on the store page to place one.</Empty>}
            <ul className="space-y-1.5 text-sm">
              {data.siteOrders.map((o) => (
                <li key={o.id} className="flex justify-between gap-2">
                  <span>
                    <span className="font-mono font-semibold">#{o.id}</span> · {o.customer_name}, {o.city} ·{" "}
                    <span className="text-stone-500">{o.items.map((i) => `${i.qty}× ${i.name} (${i.size})`).join(", ")}</span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-stone-500">Rs {o.total.toLocaleString("en-US")}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Returns */}
          <Card title="↩️ Returns started by the agent">
            {data.returns.length === 0 && <Empty>No returns yet.</Empty>}
            <ul className="space-y-1.5 text-sm">
              {data.returns.slice(0, 8).map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span><span className="font-mono font-semibold">RET-{r.id}</span> · order #{r.order_id} · <span className="text-stone-500">{r.reason}</span></span>
                  <span className="whitespace-nowrap text-xs text-stone-400">{when(r.created_at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Conversations */}
      <Card title="💬 Conversation logs" subtitle="Latest 40 chats. Open one to see every message and tool call.">
        {data.conversations.length === 0 && <Empty>No conversations yet. Try the chat on the store page.</Empty>}
        <div className="divide-y divide-stone-100">
          {data.conversations.map((c) => (
            <ConversationLog key={c.id} conversation={c} />
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Policies */}
        <Card title="📄 Policy documents (RAG)" subtitle="The agent answers policy questions only from these.">
          <ul className="mb-5 divide-y divide-stone-100 text-sm">
            {data.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-medium text-stone-800">{d.title}</span>{" "}
                  <span className="font-mono text-xs text-stone-500">{d.source} · {d.chunks} chunks</span>
                </span>
                {!CORE_POLICIES.includes(d.source) && (
                  <form action={deletePolicy}>
                    <input type="hidden" name="source" value={d.source} />
                    <button className="text-xs text-red-600 hover:underline">Delete</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <h3 className="mb-2 text-sm font-semibold text-stone-800">Upload a new policy</h3>
          <UploadForm />
        </Card>

        {/* Embed */}
        <Card title="🔌 Add the chat to any website" subtitle="Paste this one line before </body>.">
          <pre className="overflow-x-auto rounded-lg bg-stone-900 p-3 font-mono text-xs text-emerald-200">
            {`<script src="${origin}/widget.js" async></script>`}
          </pre>
          <p className="mt-3 text-xs text-stone-500">
            It adds the same floating chat button. The chat runs on this server, so it uses the same tools, policies
            and logs.
          </p>
        </Card>
      </div>
    </div>
  );
}

function ConversationLog({ conversation }: { conversation: ConversationRow }) {
  const messages = conversation.messages ?? [];
  const firstUser = messages.find((m) => m.role === "user");
  const preview = textOf(firstUser) || "(no text)";
  const turns = messages.filter((m) => m.role === "user").length;

  return (
    <details className="group py-2.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-[10px] text-stone-400 transition-transform group-open:rotate-90">▶</span>
          <span className="truncate text-sm text-stone-800">{preview}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-stone-500">
          {conversation.escalated && <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700">escalated</span>}
          <span>{turns} msg · {conversation.tool_calls} tools</span>
          <span className="hidden sm:inline">{when(conversation.updated_at)}</span>
        </span>
      </summary>
      <div className="mt-3 space-y-2 rounded-xl bg-stone-50 p-3">
        {messages.map((m, index) =>
          m.role === "user" ? (
            <div key={m.id || index} className="text-sm">
              <span className="mr-2 text-xs font-semibold text-[var(--brand)]">Customer</span>
              {textOf(m)}
            </div>
          ) : (
            <div key={m.id || index} className="space-y-1.5 border-l-2 border-stone-200 pl-3">
              <div className="text-xs font-semibold text-stone-500">ShopAssist</div>
              {m.parts.map((p, i) =>
                p.type.startsWith("tool-") ? (
                  <ToolChip key={i} part={p as unknown as ToolPartLike} />
                ) : p.type === "text" && p.text.trim() ? (
                  <p key={i} className="whitespace-pre-wrap text-sm text-stone-700">{p.text}</p>
                ) : null,
              )}
            </div>
          ),
        )}
      </div>
    </details>
  );
}

function textOf(message: UIMessage | undefined) {
  return message?.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim() ?? "";
}

function Stat({ label, value, highlight = false }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-orange-200 bg-orange-50" : "border-stone-200 bg-white"}`}>
      <div className="text-2xl font-semibold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="text-base font-semibold text-stone-900">{title}</h2>
      {subtitle && <p className="mb-3 text-xs text-stone-500">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-stone-400">{children}</p>;
}
