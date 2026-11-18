"use client";
// All products with simple category filters. Clicking a product opens the order form.
import { useState } from "react";
import { PRODUCTS, type Product } from "@/lib/seed-data";
import { ProductCard } from "./ProductCard";
import { OrderDialog } from "./OrderDialog";

const FILTERS: { label: string; category: Product["category"] | "all" }[] = [
  { label: "All", category: "all" },
  { label: "Lawn suits", category: "lawn" },
  { label: "Kurtas", category: "kurta" },
  { label: "Formals", category: "formal" },
  { label: "Dupattas", category: "dupatta" },
  { label: "Trousers", category: "trousers" },
  { label: "Kids", category: "kids" },
];

export function ProductGrid() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["category"]>("all");
  const [ordering, setOrdering] = useState<Product | null>(null);
  const products = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);

  return (
    <section id="shop" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-serif text-3xl text-stone-900">Shop the collection</h2>
        <span className="text-sm text-stone-500">Click any product to order · cash on delivery</span>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.category}
            onClick={() => setFilter(f.category)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
              filter === f.category ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onOrder={setOrdering} />
        ))}
      </div>
      {ordering && <OrderDialog product={ordering} onClose={() => setOrdering(null)} />}
    </section>
  );
}
