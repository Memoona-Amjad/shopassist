"use client";
// "Meet ShopAssist": what the assistant can do, with one-click questions and
// sample orders, so anyone can try it without their own data.
import { DEMO_PROMPTS, SAMPLE_ORDERS, askShopAssist } from "@/lib/demo-prompts";

const ICONS = ["🔎", "↩️", "🛍️", "📄", "🧑"];

const CAN_DO = [
  { icon: "🔎", text: "Tracks your order after a quick check of your phone number" },
  { icon: "↩️", text: "Starts returns, but always asks you before doing it" },
  { icon: "📄", text: "Answers from our real policies, and says so when it doesn't know" },
  { icon: "🧑", text: "Hands you to a person whenever you want, with a summary" },
];

export function DemoPanel() {
  return (
    <section id="assistant" className="scroll-mt-20 bg-[var(--cream)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--brand)] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Meet ShopAssist · our AI assistant
            </div>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-stone-900 sm:text-4xl">Help that actually gets things done.</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone-600">
              ShopAssist doesn&apos;t just chat. It looks up orders, applies our return rules and finds the right outfit,
              and you can see each step it takes under every answer. Try it with sample data:
            </p>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {DEMO_PROMPTS.map((p, i) => (
                <button
                  key={p.text}
                  onClick={() => askShopAssist(p.text)}
                  className="group flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 text-left shadow-sm transition hover:border-[var(--brand)]/40 hover:shadow-md"
                >
                  <span className="text-xl" aria-hidden>{ICONS[i]}</span>
                  <span>
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">{p.label}</span>
                    <span className="text-sm text-stone-800">“{p.text}”</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900">🧪 Sample orders you can use</h3>
              <p className="mb-3 mt-0.5 text-xs text-stone-500">Made-up data. The assistant asks for the last 4 digits of the phone to verify you.</p>
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-stone-400">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Order</th>
                    <th className="pb-2 pr-3 font-medium">Phone ends</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {SAMPLE_ORDERS.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2 pr-3 font-mono font-semibold text-[var(--brand)]">#{o.id}</td>
                      <td className="py-2 pr-3 font-mono">{o.phoneLast4}</td>
                      <td className="py-2 text-xs text-stone-600">{o.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-2.5 rounded-2xl bg-[var(--brand)] p-5 text-sm text-emerald-50">
              {CAN_DO.map((c) => (
                <li key={c.text} className="flex gap-2.5">
                  <span aria-hidden>{c.icon}</span>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
