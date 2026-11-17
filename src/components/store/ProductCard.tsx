"use client";
// A product card. There are no photos in this demo, so each product gets a
// "fabric swatch" drawn with CSS from its colours.
import type { Product } from "@/lib/seed-data";
import { askShopAssist } from "@/lib/demo-prompts";

const COLOR_HEX: Record<string, string> = {
  coral: "#f08a6c", white: "#f4efe6", blue: "#3d5a9e", mint: "#a8dcc5", mustard: "#d9a62e", maroon: "#7b2733",
  pink: "#e79bb5", indigo: "#3b3f8c", teal: "#2f8a8a", red: "#b8302f", gold: "#cfa548", lilac: "#bda6dc",
  emerald: "#2b7a57", peach: "#f3b493", black: "#2a2a2a", "sky blue": "#8cc3e8", rust: "#b5532f", sage: "#9fb59a",
  navy: "#24345c", multicolour: "#d77a61", blush: "#efc1c1", ivory: "#f6f0dc", magenta: "#b83b84", beige: "#dcc8a8",
  yellow: "#f1cf4b",
};

export function ProductCard({ product }: { product: Product }) {
  const [c1, c2] = [product.colors[0], product.colors[1] ?? product.colors[0]].map((c) => COLOR_HEX[c] ?? "#c9b8a0");
  return (
    <div className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:shadow-lg">
      <div
        className="relative aspect-[4/5]"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${c2}aa 0 7%, transparent 8%) 0 0/38px 38px,
                       radial-gradient(circle at 70% 65%, #ffffff55 0 5%, transparent 6%) 0 0/26px 26px,
                       linear-gradient(135deg, ${c1}, ${c2})`,
        }}
      >
        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-stone-700">Sold out</span>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium capitalize text-stone-700">
          {product.category}
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="line-clamp-1 text-sm font-medium text-stone-900">{product.name}</h3>
        <p className="mt-0.5 text-xs text-stone-500">{product.fabric} · {product.sizes.join(", ")}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--brand)]">Rs {product.price.toLocaleString("en-US")}</span>
          <button
            onClick={() => askShopAssist(`Tell me about the ${product.name}. Which sizes and colours are available?`)}
            className="rounded-full px-2 py-1 text-[11px] font-medium text-[var(--accent)] opacity-80 hover:bg-orange-50 hover:opacity-100"
          >
            Ask ShopAssist →
          </button>
        </div>
      </div>
    </div>
  );
}
