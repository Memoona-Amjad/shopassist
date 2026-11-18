"use client";
// Store header. Category links filter the product grid (and scroll to it);
// "Track order" opens the chat assistant.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { askShopAssist } from "@/lib/demo-prompts";
import type { ShopCategory } from "@/lib/shop-events";
import { CategoryLink } from "./CategoryLink";

const NAV: { label: string; category: ShopCategory }[] = [
  { label: "Lawn suits", category: "lawn" },
  { label: "Kurtas", category: "kurta" },
  { label: "Formals", category: "formal" },
  { label: "Kids", category: "kids" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <div className="bg-stone-900 px-4 py-2 text-center text-[12px] text-stone-200">
        🚚 Free delivery on orders over Rs 5,000 · 💵 Cash on delivery across Pakistan · ↩️ 14-day returns
      </div>
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="font-serif text-2xl tracking-tight text-[var(--brand)]">
            Lawn &amp; Loom
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-stone-600 md:flex" aria-label="Shop">
            {NAV.map((n) => (
              <CategoryLink key={n.category} category={n.category} className="transition hover:text-stone-900">
                {n.label}
              </CategoryLink>
            ))}
            <Link href="/policies/faq" className={`transition hover:text-stone-900 ${pathname.startsWith("/policies") ? "text-stone-900" : ""}`}>
              Help
            </Link>
          </nav>
          <button
            onClick={() => askShopAssist("I want to track my order")}
            className="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-500"
          >
            📦 Track order
          </button>
        </div>
      </header>
    </>
  );
}
