"use client";
// The shop: search, category filters, sorting and the product grid.
// Clicking a product opens the product view with the order form.
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/seed-data";
import { ProductCard } from "./ProductCard";
import { OrderDialog } from "./OrderDialog";

type Category = Product["category"] | "all";
type Sort = "featured" | "price-asc" | "price-desc";

const FILTERS: { label: string; category: Category }[] = [
  { label: "All", category: "all" },
  { label: "Lawn suits", category: "lawn" },
  { label: "Kurtas", category: "kurta" },
  { label: "Formals", category: "formal" },
  { label: "Dupattas", category: "dupatta" },
  { label: "Trousers", category: "trousers" },
  { label: "Kids", category: "kids" },
];

export function ProductGrid({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [open, setOpen] = useState<Product | null>(null);

  // Header/footer category links: "/?c=kurta#shop" from other pages, or a browser event on this page.
  useEffect(() => {
    const pick = (c: string | null) => {
      if (c && FILTERS.some((f) => f.category === c)) {
        setCategory(c as Category);
        setQuery("");
      }
    };
    const onEvent = (e: Event) => pick(String((e as CustomEvent).detail));
    window.addEventListener("shop:category", onEvent);
    const fromUrl = new URLSearchParams(window.location.search).get("c");
    if (fromUrl) queueMicrotask(() => pick(fromUrl)); // after the first render
    return () => window.removeEventListener("shop:category", onEvent);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products
      .filter((p) => category === "all" || p.category === category)
      .filter((p) => !q || `${p.name} ${p.fabric} ${p.colors.join(" ")} ${p.category}`.toLowerCase().includes(q));
    // Sold-out items always go last.
    const inStockFirst = (a: Product, b: Product) => Number(b.stock > 0) - Number(a.stock > 0);
    if (sort === "price-asc") return [...list].sort((a, b) => inStockFirst(a, b) || a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => inStockFirst(a, b) || b.price - a.price);
    return [...list].sort(inStockFirst);
  }, [products, category, query, sort]);

  const countFor = (c: Category) => (c === "all" ? products.length : products.filter((p) => p.category === c).length);

  return (
    <section id="shop" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl text-stone-900 sm:text-4xl">Shop the collection</h2>
          <p className="mt-1 text-sm text-stone-500">Cash on delivery across Pakistan · free shipping from Rs 5,000</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-60 sm:flex-none">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lawn, black, kurta…"
              aria-label="Search products"
              className="w-full rounded-full border border-stone-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-[var(--brand)]"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort products"
            className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {/* Category pills (scroll sideways on small phones) */}
      <div className="-mx-4 mb-7 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.category}
            onClick={() => setCategory(f.category)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              category === f.category
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
            }`}
          >
            {f.label} <span className={category === f.category ? "text-emerald-100" : "text-stone-400"}>{countFor(f.category)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 p-12 text-center">
          <p className="text-sm text-stone-600">No products match “{query}”.</p>
          <button onClick={() => { setQuery(""); setCategory("all"); }} className="mt-3 text-sm font-semibold text-[var(--brand)] underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={setOpen} />
          ))}
        </div>
      )}

      {open && <OrderDialog product={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** Shown while products load. */
export function ProductGridSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <div className="mb-8 h-10 w-72 animate-pulse rounded-lg bg-stone-200" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-stone-200" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </section>
  );
}
