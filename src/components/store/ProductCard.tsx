"use client";
// A product card. Shows the owner's photo if there is one, otherwise a CSS
// "fabric swatch". Badges sit in the corners so nothing covers the text.
import Image from "next/image";
import type { Product } from "@/lib/seed-data";
import { askShopAssist } from "@/lib/demo-prompts";
import { swatchStyle } from "./swatch";

export const LOW_STOCK = 5;

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const soldOut = product.stock <= 0 || !product.in_stock;
  const low = !soldOut && product.stock <= LOW_STOCK;

  return (
    <article className="group flex flex-col">
      {/* Picture: click to open the product */}
      <button
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`View ${product.name}`}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone-100 outline-none ring-[var(--brand)] ring-offset-2 focus-visible:ring-2"
      >
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.04] ${soldOut ? "opacity-60 grayscale" : ""}`}
          style={swatchStyle(product)} /* shows while the photo loads, or when there is none */
        >
          {product.image_url && (
            <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" />
          )}
        </div>

        {/* Corner badges */}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium capitalize text-stone-700 shadow-sm">
          {product.category}
        </span>
        {soldOut && <span className="absolute right-2.5 top-2.5 rounded-full bg-stone-900/85 px-2 py-0.5 text-[11px] font-semibold text-white">Sold out</span>}
        {low && <span className="absolute right-2.5 top-2.5 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950">Only {product.stock} left</span>}

        {/* Hover hint (bottom of the picture, where there is no text) */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 justify-center bg-gradient-to-t from-black/35 to-transparent pb-3 pt-10 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-900 shadow-md">Quick view</span>
        </span>
      </button>

      {/* Details */}
      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <button type="button" onClick={() => onOpen(product)} className="text-left">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-stone-900 group-hover:text-[var(--brand)]">{product.name}</h3>
        </button>
        <p className="mt-0.5 truncate text-xs text-stone-500">
          {product.fabric} · {product.sizes.length === 1 ? product.sizes[0] : `${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}`}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-stone-900">Rs {product.price.toLocaleString("en-US")}</span>
          <button
            type="button"
            title="Ask ShopAssist about this product"
            onClick={() => askShopAssist(`Tell me about the ${product.name}. Which sizes and colours are available?`)}
            className="rounded-full px-2 py-1 text-[11px] font-medium text-[var(--accent)] hover:bg-orange-50"
          >
            💬 Ask
          </button>
        </div>
        <button
          type="button"
          onClick={() => onOpen(product)}
          disabled={soldOut}
          className="mt-2.5 w-full rounded-full bg-[var(--brand)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
        >
          {soldOut ? "Sold out" : "Order now"}
        </button>
      </div>
    </article>
  );
}
