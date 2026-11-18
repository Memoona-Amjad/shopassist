"use client";
// "Try with sample data": one click sends a demo prompt to the chat widget.
import { DEMO_PROMPTS, SAMPLE_ORDERS, askShopAssist } from "@/lib/demo-prompts";

const ICONS = ["🔎", "↩️", "🛍️", "📄", "🧑"];

export function DemoPanel() {
  return (
    <section id="try" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid gap-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            ✨ Try with sample data
          </div>
          <h2 className="font-serif text-3xl text-stone-900">Click a question. Watch the agent work.</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
            ShopAssist doesn&apos;t just chat. It checks real orders, verifies the customer, applies the return policy,
            asks before acting, and hands over to a human when needed. Every step shows up as a chip in the chat.
          </p>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {DEMO_PROMPTS.map((p, i) => (
              <button
                key={p.text}
                onClick={() => askShopAssist(p.text)}
                className="group flex items-start gap-3 rounded-2xl border border-stone-200 bg-[var(--cream)] p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[var(--brand)]/40 hover:shadow-md"
              >
                <span className="text-xl">{ICONS[i]}</span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">{p.label}</span>
                  <span className="text-sm text-stone-800">“{p.text}”</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--cream)] p-5">
          <h3 className="text-sm font-semibold text-stone-900">Sample orders you can use</h3>
          <p className="mb-3 text-xs text-stone-500">Made-up data. The agent asks for the last 4 digits of the phone to verify you.</p>
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="pb-2 font-medium">Order</th>
                <th className="pb-2 font-medium">Phone ends</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {SAMPLE_ORDERS.map((o) => (
                <tr key={o.id}>
                  <td className="py-2 pr-3 font-mono font-semibold text-[var(--brand)]">#{o.id}</td>
                  <td className="py-2 pr-3 font-mono">{o.phoneLast4}</td>
                  <td className="py-2 text-xs text-stone-600">{o.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-stone-500">
            Try a wrong phone number, a late return (#1029) or an order that hasn&apos;t shipped (#1033) and see the agent
            say no, with the reason.
          </p>
        </div>
      </div>
    </section>
  );
}
