"use client";
// Owner view of all products: photo upload/remove and stock levels.
// Changes are saved with server actions and show up on the store immediately.
import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import type { Product } from "@/lib/seed-data";
import { swatchStyle } from "@/components/store/swatch";
import { compressImage } from "@/lib/compress-image";
import { removeProductImage, setStock, uploadProductImage, type ProductActionState } from "./actions";

const LOW_STOCK = 5;
type Filter = "all" | "low" | "soldout" | "nophoto";

export function ProductManager({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = {
    all: products.length,
    low: products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length,
    soldout: products.filter((p) => p.stock === 0).length,
    nophoto: products.filter((p) => !p.image_url).length,
  };
  const visible = useMemo(
    () =>
      products
        .filter((p) =>
          filter === "low" ? p.stock > 0 && p.stock <= LOW_STOCK : filter === "soldout" ? p.stock === 0 : filter === "nophoto" ? !p.image_url : true,
        )
        .filter((p) => `${p.name} ${p.id} ${p.category}`.toLowerCase().includes(query.trim().toLowerCase())),
    [products, filter, query],
  );

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "low", label: "Low stock" },
    { key: "soldout", label: "Sold out" },
    { key: "nophoto", label: "No photo" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-900">Products &amp; stock</h1>
        <p className="mt-1 text-sm text-stone-500">
          Add photos and set stock. A product with 0 stock shows as <b>Sold out</b> on the store, can&apos;t be ordered, and
          the AI agent tells customers it&apos;s unavailable. Orders reduce stock automatically.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                filter === t.key ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
              }`}
            >
              {t.label} <span className="opacity-70">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm outline-none focus:border-[var(--brand)] sm:w-64"
        />
      </div>

      {visible.length === 0 && <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">No products match.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const [stockInput, setStockInput] = useState(String(product.stock));
  const [status, setStatus] = useState<ProductActionState>({});
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const run = (action: () => Promise<ProductActionState>) =>
    startTransition(async () => {
      setStatus({});
      const result = await action().catch(() => ({ ok: false, message: "Something went wrong. Please try again." }));
      setStatus(result);
    });

  const saveStock = (value: number) => {
    setStockInput(String(value));
    run(() => setStock(product.id, value));
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    run(async () => {
      const small = await compressImage(file).catch(() => file);
      const form = new FormData();
      form.set("productId", product.id);
      form.set("image", small);
      return uploadProductImage(form);
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const stockBadge =
    product.stock === 0
      ? { text: "Sold out", cls: "bg-stone-800 text-white" }
      : product.stock <= LOW_STOCK
        ? { text: `Low · ${product.stock} left`, cls: "bg-amber-100 text-amber-800" }
        : { text: `In stock · ${product.stock}`, cls: "bg-emerald-50 text-emerald-700" };
  const dirty = stockInput !== String(product.stock);

  return (
    <div className={`flex gap-4 rounded-2xl border border-stone-200 bg-white p-3 transition ${pending ? "opacity-60" : ""}`}>
      {/* Photo */}
      <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl" style={swatchStyle(product)}>
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="112px" className="object-cover" />
        ) : (
          <span className="absolute inset-x-1.5 bottom-1.5 rounded bg-white/85 px-1 py-0.5 text-center text-[10px] text-stone-600">No photo</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-stone-900">{product.name}</div>
            <div className="text-xs text-stone-500">
              <span className="font-mono">{product.id}</span> · Rs {product.price.toLocaleString("en-US")} · <span className="capitalize">{product.category}</span>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${stockBadge.cls}`}>{stockBadge.text}</span>
        </div>

        {/* Stock */}
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="text-xs text-stone-500" htmlFor={`stock-${product.id}`}>Stock</label>
          <input
            id={`stock-${product.id}`}
            type="number"
            min={0}
            max={9999}
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && dirty && saveStock(Number(stockInput))}
            className="w-20 rounded-lg border border-stone-300 px-2 py-1 text-sm outline-none focus:border-[var(--brand)]"
          />
          {dirty && (
            <button disabled={pending} onClick={() => saveStock(Number(stockInput))} className="rounded-lg bg-[var(--brand)] px-2.5 py-1 text-xs font-semibold text-white">
              Save
            </button>
          )}
          {product.stock > 0 ? (
            <button disabled={pending} onClick={() => saveStock(0)} className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50">
              Mark sold out
            </button>
          ) : (
            <button disabled={pending} onClick={() => saveStock(20)} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100">
              Restock (20)
            </button>
          )}
        </div>

        {/* Photo actions */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <button disabled={pending} onClick={() => fileRef.current?.click()} className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50">
            {product.image_url ? "Replace photo" : "📷 Add photo"}
          </button>
          {product.image_url && (
            <button disabled={pending} onClick={() => run(() => removeProductImage(product.id))} className="rounded-lg px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">
              Remove photo
            </button>
          )}
          <span className={`text-xs ${status.ok === false ? "text-red-600" : "text-emerald-700"}`} role="status">
            {pending ? "Saving…" : status.message}
          </span>
        </div>
      </div>
    </div>
  );
}
