import Link from "next/link";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { DemoPanel } from "@/components/store/DemoPanel";
import { ProductCard } from "@/components/store/ProductCard";
import { PRODUCTS } from "@/lib/seed-data";

// The demo storefront. Products come from the same seed catalogue that is in the
// database, so the page is static, fast and never breaks if the database is slow.
const FEATURED = PRODUCTS.filter((p) => ["lawn", "kurta", "formal"].includes(p.category)).slice(0, 12);

const TOOLS = [
  { icon: "📄", name: "searchPolicies", text: "Finds the answer in the store's own policy docs (RAG) and cites the source." },
  { icon: "🛍️", name: "searchProducts", text: "Searches the catalogue by keyword, price and size." },
  { icon: "🔎", name: "getOrderStatus", text: "Looks up an order, only after verifying the phone's last 4 digits." },
  { icon: "↩️", name: "startReturn", text: "Checks the 14-day rule, then asks the customer to confirm before acting." },
  { icon: "🧑", name: "escalateToHuman", text: "Hands angry or stuck chats to a person, with a summary." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Demo notice */}
      <div className="bg-stone-900 px-4 py-2 text-center text-xs text-stone-200">
        Demo store: <b>Lawn &amp; Loom</b> is fictional. Chat with <b>ShopAssist</b>, an AI agent that takes real actions on
        sample data.{" "}
        <a href="#try" className="underline underline-offset-2">Try it →</a>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-serif text-2xl text-[var(--brand)]">Lawn &amp; Loom</Link>
          <nav className="hidden gap-6 text-sm text-stone-600 sm:flex">
            <a href="#shop" className="hover:text-stone-900">Summer Lawn</a>
            <a href="#shop" className="hover:text-stone-900">Kurtas</a>
            <a href="#shop" className="hover:text-stone-900">Formals</a>
            <a href="#how" className="hover:text-stone-900">How the agent works</a>
          </nav>
          <Link href="/admin" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-white">
            Owner dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--brand)] text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 25% 30%, #f4c9a8 0 3%, transparent 4%) 0 0/60px 60px, radial-gradient(circle at 70% 70%, #ffffff 0 2%, transparent 3%) 0 0/40px 40px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Summer Lawn ’26</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              Breezy prints for long summer days.
            </h1>
            <p className="mt-4 max-w-md text-emerald-50/90">
              Unstitched 3-piece lawn suits, everyday kurtas and festive formals. Delivered across Pakistan, with cash on delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#shop" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand)]">Shop the collection</a>
              <a href="#try" className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                💬 Try the AI support agent
              </a>
            </div>
          </div>
          <div className="hidden items-center justify-center lg:flex">
            <div className="grid grid-cols-3 gap-3">
              {PRODUCTS.slice(0, 6).map((p, i) => (
                <div
                  key={p.id}
                  className={`h-36 w-28 rounded-2xl shadow-2xl ${i % 2 ? "translate-y-6" : ""}`}
                  style={{ background: `linear-gradient(160deg, var(--cream), ${["#f08a6c", "#3d5a9e", "#a8dcc5", "#d9a62e", "#f4efe6", "#e79bb5"][i]})` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <DemoPanel />

      {/* Products */}
      <section id="shop" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-3xl text-stone-900">New arrivals</h2>
          <span className="text-sm text-stone-500">{PRODUCTS.length} products in the demo catalogue</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {FEATURED.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-stone-200 bg-[var(--cream)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-serif text-3xl text-stone-900">How the agent works</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Each message runs an agent loop: the model reads the chat, picks a tool, reads the result, and repeats
            (up to 6 steps) before answering. The rules (phone checks, the 14-day window, confirm-before-acting) are
            enforced in code, not left to the AI.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TOOLS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="text-2xl">{t.icon}</div>
                <div className="mt-2 font-mono text-xs font-semibold text-[var(--brand)]">{t.name}</div>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-500">
        Lawn &amp; Loom is a fictional store made for a portfolio demo. ·{" "}
        <a href="https://github.com/Memoona-Amjad/shopassist" className="underline">Source on GitHub</a> ·{" "}
        <Link href="/admin" className="underline">Owner dashboard</Link>
      </footer>

      <ChatWidget />
    </div>
  );
}
