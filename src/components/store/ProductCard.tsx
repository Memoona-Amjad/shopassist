"use client";
// A product card. There are no photos in this demo, so each product gets a
// "fabric swatch" drawn with CSS from its colours. Clicking the card opens the order form.
import type { Product } from "@/lib/seed-data";
import { askShopAssist } from "@/lib/demo-prompts";
import { swatchStyle } from "./swatch";

export function ProductCard({ product, onOrder }: { product: Product; onOrder: (p: Product) => void }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow hover:shadow-lg">
      <button
        type="button"
        onClick={() => onOrder(product)}
        className="relative block aspect-[4/5] w-full text-left"
        style={swatchStyle(product)}
        aria-label={`Order ${product.name}`}
      >
        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-stone-700">Sold out</span>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium capitalize text-stone-700">
          {product.category}
        </span>
        {product.in_stock && (
          <span className="absolute inset-x-3 bottom-3 hidden rounded-full bg-[var(--brand)] py-2 text-center text-xs font-semibold text-white shadow-lg group-hover:block">
            Order now
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-3.5">
        <button type="button" onClick={() => onOrder(product)} className="text-left">
          <h3 className="line-clamp-1 text-sm font-medium text-stone-900 group-hover:text-[var(--brand)]">{product.name}</h3>
          <p className="mt-0.5 text-xs text-stone-500">{product.fabric} · {product.sizes.join(", ")}</p>
        </button>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-[var(--brand)]">Rs {product.price.toLocaleString("en-US")}</span>
          <button
            type="button"
            onClick={() => askShopAssist(`Tell me about the ${product.name}. Which sizes and colours are available?`)}
            className="rounded-full px-2 py-1 text-[11px] font-medium text-[var(--accent)] opacity-80 hover:bg-orange-50 hover:opacity-100"
          >
            Ask ShopAssist →
          </button>
        </div>
        <button
          type="button"
          onClick={() => onOrder(product)}
          disabled={!product.in_stock}
          className="mt-2 w-full rounded-full border border-[var(--brand)] py-1.5 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent"
        >
          {product.in_stock ? "Order now · Cash on delivery" : "Sold out"}
        </button>
      </div>
    </div>
  );
}
