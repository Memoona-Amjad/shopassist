// A CSS "fabric swatch" for products (the demo has no photos).
import type { CSSProperties } from "react";
import type { Product } from "@/lib/seed-data";

const COLOR_HEX: Record<string, string> = {
  coral: "#f08a6c", white: "#f4efe6", blue: "#3d5a9e", mint: "#a8dcc5", mustard: "#d9a62e", maroon: "#7b2733",
  pink: "#e79bb5", indigo: "#3b3f8c", teal: "#2f8a8a", red: "#b8302f", gold: "#cfa548", lilac: "#bda6dc",
  emerald: "#2b7a57", peach: "#f3b493", black: "#2a2a2a", "sky blue": "#8cc3e8", rust: "#b5532f", sage: "#9fb59a",
  navy: "#24345c", multicolour: "#d77a61", blush: "#efc1c1", ivory: "#f6f0dc", magenta: "#b83b84", beige: "#dcc8a8",
  yellow: "#f1cf4b",
};

/** The CSS "fabric" background for a product (also used in the order form). */
export function swatchStyle(product: Product): CSSProperties {
  const [c1, c2] = [product.colors[0], product.colors[1] ?? product.colors[0]].map((c) => COLOR_HEX[c] ?? "#c9b8a0");
  return {
    background: `radial-gradient(circle at 20% 20%, ${c2}aa 0 7%, transparent 8%) 0 0/38px 38px,
                 radial-gradient(circle at 70% 65%, #ffffff55 0 5%, transparent 6%) 0 0/26px 26px,
                 linear-gradient(135deg, ${c1}, ${c2})`,
  };
}
