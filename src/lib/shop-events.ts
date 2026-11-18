// Tiny browser events so the header can filter the product grid on the same page.
export type ShopCategory = "lawn" | "kurta" | "formal" | "dupatta" | "trousers" | "kids";

export function showCategory(category: ShopCategory) {
  window.dispatchEvent(new CustomEvent("shop:category", { detail: category }));
  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
}
