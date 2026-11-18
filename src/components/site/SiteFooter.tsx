import Link from "next/link";
import { FooterChatButton } from "./FooterChatButton";
import { CategoryLink } from "./CategoryLink";
import type { ShopCategory } from "@/lib/shop-events";

const HELP = [
  { href: "/policies/shipping", label: "Shipping & delivery" },
  { href: "/policies/returns", label: "Returns & exchanges" },
  { href: "/policies/sizing", label: "Size guide" },
  { href: "/policies/faq", label: "FAQs" },
  { href: "/policies/contact", label: "Contact us" },
];

const SHOP: { category: ShopCategory; label: string }[] = [
  { category: "lawn", label: "Lawn suits" },
  { category: "kurta", label: "Kurtas" },
  { category: "formal", label: "Formals" },
  { category: "dupatta", label: "Dupattas" },
  { category: "kids", label: "Kids" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-900 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="font-serif text-2xl text-white">Lawn &amp; Loom</div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-400">
            Breezy lawn, everyday kurtas and festive formals, delivered across Pakistan with cash on delivery.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            {["💵 Cash on delivery", "🚚 All of Pakistan", "↩️ 14-day returns"].map((b) => (
              <span key={b} className="rounded-full border border-stone-700 px-2.5 py-1 text-stone-300">{b}</span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {SHOP.map((l) => (
              <li key={l.category}>
                <CategoryLink category={l.category} className="text-stone-400 transition hover:text-white">{l.label}</CategoryLink>
              </li>
            ))}
          </ul>
        </div>
        <FooterColumn title="Help" links={HELP} />
        <div>
          <h3 className="text-sm font-semibold text-white">Talk to us</h3>
          <p className="mt-3 text-sm text-stone-400">Our AI assistant is available 24/7 and can hand you to a person any time.</p>
          <FooterChatButton />
          <p className="mt-4 text-xs text-stone-500">Team hours: Mon–Sat, 10 am – 7 pm</p>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 Lawn &amp; Loom. A fictional demo store built by Memoona Amjad to show the ShopAssist AI agent.</p>
          <div className="flex gap-4">
            <a href="https://github.com/Memoona-Amjad/shopassist" className="hover:text-stone-300">Source on GitHub</a>
            <Link href="/admin" className="hover:text-stone-300">Store owner login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-stone-400 transition hover:text-white">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
