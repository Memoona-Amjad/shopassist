"use client";
// Product view + order form. It creates a real (demo) order through /api/orders,
// then offers to track it with ShopAssist.
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/seed-data";
import { ALL_CITIES, COD_LIMIT, FREE_SHIPPING_FROM, deliveryWindow, shippingFor } from "@/lib/shipping";
import { askShopAssist } from "@/lib/demo-prompts";
import { swatchStyle } from "./swatch";
import { LOW_STOCK } from "./ProductCard";

type Placed = { orderId: number; total: number; phoneLast4: string; deliveryDays: string };

const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;
const MAX_QTY = 5;

export function OrderDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const soldOut = product.stock <= 0 || !product.in_stock;
  const maxQty = Math.max(1, Math.min(MAX_QTY, product.stock));
  const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0] : "");
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);

  // Close with Escape, and stop the page behind from scrolling while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const subtotal = product.price * qty;
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const [minDays, maxDays] = deliveryWindow(form.city || "Other");
  const tooBig = total > COD_LIMIT;
  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [field]: e.target.value });
    setError(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!size) return setError("Please choose a size.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id, size, qty, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Sorry, something went wrong. Please try again.");
      else setPlaced(data as Placed);
    } catch {
      setError("Network problem. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const field = "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15";
  const label = "mb-1 block text-xs font-medium text-stone-600";

  return (
    <div className="fade-in fixed inset-0 z-[60] flex items-end justify-center bg-stone-900/50 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onClick={(e) => e.stopPropagation()}
        className="modal-in relative max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl text-stone-500 shadow-sm hover:text-stone-900"
        >
          ×
        </button>

        {placed ? (
          // ---------- Success ----------
          <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">✓</div>
            <h2 className="font-serif text-3xl text-stone-900">Order #{placed.orderId} placed!</h2>
            <p className="text-sm leading-relaxed text-stone-600">
              {qty} × {product.name} ({size}) · <b>{rs(placed.total)}</b> cash on delivery.
              <br />
              We dispatch in 1–2 working days, then delivery takes about {placed.deliveryDays} working days.
            </p>
            <div className="rounded-2xl bg-[var(--cream)] p-4 text-sm text-stone-700">
              Ask our AI assistant about it any time. You&apos;ll need order <b>#{placed.orderId}</b> and the last 4 digits of
              your phone (<b>{placed.phoneLast4}</b>).
            </div>
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <button
                onClick={() => {
                  onClose();
                  askShopAssist(`Where is my order #${placed.orderId}? Phone ends ${placed.phoneLast4}`);
                }}
                className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
              >
                💬 Track it with ShopAssist
              </button>
              <button onClick={onClose} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
                Continue shopping
              </button>
            </div>
            <p className="text-[11px] text-stone-400">Demo store: no real order is shipped. Demo orders are cleared every night.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* ---------- Picture ---------- */}
            <div
              className="relative aspect-[4/3] md:aspect-auto md:min-h-[560px]"
              style={swatchStyle(product)} /* shows while the photo loads, or when there is none */
            >
              {product.image_url && (
                <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" priority />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium capitalize text-stone-700">
                {product.category}
              </span>
            </div>

            {/* ---------- Details + form ---------- */}
            <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
              <div className="pr-8">
                <h2 className="font-serif text-2xl leading-tight text-stone-900 sm:text-3xl">{product.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xl font-semibold text-stone-900">{rs(product.price)}</span>
                  {soldOut ? (
                    <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[11px] font-semibold text-white">Sold out</span>
                  ) : product.stock <= LOW_STOCK ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Only {product.stock} left</span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">In stock</span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{product.description}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {product.fabric} · Colours: <span className="capitalize">{product.colors.join(", ")}</span>
                </p>
              </div>

              {soldOut ? (
                <div className="space-y-3 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
                  <p>Sorry, this design is sold out. Popular designs are sometimes restocked within 4–6 weeks.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      askShopAssist(`The ${product.name} is sold out. Can you suggest something similar?`);
                    }}
                    className="font-semibold text-[var(--brand)] underline"
                  >
                    Ask ShopAssist for something similar →
                  </button>
                </div>
              ) : (
                <>
                  {/* Size and quantity */}
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-stone-600">Size{size && <span className="text-stone-900">: {size}</span>}</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            askShopAssist(`Which size should I choose for the ${product.name}? What are the measurements?`);
                          }}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          Not sure? Ask ShopAssist
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            aria-pressed={size === s}
                            onClick={() => {
                              setSize(s);
                              setError(null);
                            }}
                            className={`min-w-11 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                              size === s ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-stone-300 text-stone-700 hover:border-stone-500"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-stone-600">Quantity</span>
                      <div className="flex items-center rounded-xl border border-stone-300">
                        <button type="button" aria-label="Less" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="px-3 py-1.5 text-stone-600 disabled:opacity-30">−</button>
                        <span className="w-7 text-center text-sm font-medium">{qty}</span>
                        <button type="button" aria-label="More" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)} className="px-3 py-1.5 text-stone-600 disabled:opacity-30">+</button>
                      </div>
                      {qty >= maxQty && <span className="text-[11px] text-stone-500">Max {maxQty} per order</span>}
                    </div>
                  </div>

                  {/* Delivery details */}
                  <fieldset className="space-y-3">
                    <legend className="mb-2 text-sm font-semibold text-stone-900">Delivery details</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        <span className={label}>Full name</span>
                        <input required autoComplete="name" value={form.name} onChange={update("name")} className={field} placeholder="e.g. Sara Ahmed" />
                      </label>
                      <label>
                        <span className={label}>Mobile number</span>
                        <input required inputMode="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} className={field} placeholder="0300 1234567" />
                      </label>
                      <label>
                        <span className={label}>City</span>
                        <select required value={form.city} onChange={update("city")} className={field}>
                          <option value="">Choose your city</option>
                          {ALL_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className={label}>Address</span>
                        <input required autoComplete="street-address" value={form.address} onChange={update("address")} className={field} placeholder="House, street, area" />
                      </label>
                    </div>
                  </fieldset>

                  {/* Summary */}
                  <div className="space-y-1.5 rounded-2xl bg-[var(--cream)] p-4 text-sm">
                    <div className="flex justify-between text-stone-600"><span>Subtotal ({qty} item{qty > 1 ? "s" : ""})</span><span>{rs(subtotal)}</span></div>
                    <div className="flex justify-between text-stone-600">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? <span className="font-medium text-emerald-700">Free</span> : rs(shipping)}</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-200 pt-1.5 text-base font-semibold text-stone-900">
                      <span>Total</span>
                      <span>{rs(total)}</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      💵 Cash on delivery ·{" "}
                      {form.city ? `🚚 ${minDays}–${maxDays} working days after dispatch` : "Choose your city to see delivery time"}
                      {shipping > 0 && ` · Add ${rs(FREE_SHIPPING_FROM - subtotal)} more for free shipping`}
                    </div>
                  </div>

                  {(tooBig || error) && (
                    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                      {tooBig ? `Cash on delivery is available up to ${rs(COD_LIMIT)}. Please reduce the quantity.` : error}
                    </p>
                  )}

                  <button
                    disabled={submitting || tooBig}
                    className="w-full rounded-full bg-[var(--brand)] py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[var(--brand-dark)] disabled:opacity-50"
                  >
                    {submitting ? "Placing your order…" : `Place order · ${rs(total)}`}
                  </button>
                  <p className="text-center text-[11px] text-stone-400">Demo store: no payment is taken and nothing is shipped.</p>
                </>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
