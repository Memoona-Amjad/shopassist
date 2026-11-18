"use client";
// The order form shown when a product is clicked. It creates a real (demo) order
// through /api/orders, then offers to track it with ShopAssist.
import { useEffect, useState } from "react";
import type { Product } from "@/lib/seed-data";
import { ALL_CITIES, COD_LIMIT, deliveryWindow, shippingFor } from "@/lib/shipping";
import { askShopAssist } from "@/lib/demo-prompts";
import { swatchStyle } from "./swatch";

type Placed = { orderId: number; total: number; phoneLast4: string; deliveryDays: string };

const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

export function OrderDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0] : "");
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);

  // Close with the Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const subtotal = product.price * qty;
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const [minDays, maxDays] = deliveryWindow(form.city || "Other");
  const tooBig = total > COD_LIMIT;

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

  const input = "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${product.name}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        {placed ? (
          // ---------- Success ----------
          <div className="space-y-4 p-6 text-center sm:p-8">
            <div className="text-5xl">🎉</div>
            <h2 className="font-serif text-3xl text-stone-900">Order #{placed.orderId} placed!</h2>
            <p className="text-sm text-stone-600">
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
                className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                💬 Track it with ShopAssist
              </button>
              <button onClick={onClose} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700">
                Continue shopping
              </button>
            </div>
            <p className="text-[11px] text-stone-400">Demo store: no real order is shipped. Demo orders are cleared every night.</p>
          </div>
        ) : (
          // ---------- Order form ----------
          <form onSubmit={submit} className="grid gap-0 sm:grid-cols-[220px_1fr]">
            <div className="relative hidden sm:block" style={swatchStyle(product)}>
              <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium capitalize text-stone-700">
                {product.category}
              </span>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl leading-tight text-stone-900">{product.name}</h2>
                  <p className="mt-1 text-xs text-stone-500">{product.fabric} · {product.description}</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--brand)]">{rs(product.price)}</p>
                </div>
                <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-stone-400 hover:text-stone-700">
                  ×
                </button>
              </div>

              {!product.in_stock ? (
                <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-600">
                  Sorry, this design is sold out. Popular designs are sometimes restocked within 4–6 weeks.
                </p>
              ) : (
                <>
                  {/* Size and quantity */}
                  <div className="flex flex-wrap items-end gap-5">
                    <div>
                      <div className="mb-1 text-xs font-medium text-stone-600">Size</div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSize(s);
                              setError(null);
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                              size === s ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-stone-300 text-stone-700 hover:border-stone-500"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium text-stone-600">Quantity</div>
                      <div className="flex items-center rounded-lg border border-stone-300">
                        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-stone-600">−</button>
                        <span className="w-6 text-center text-sm">{qty}</span>
                        <button type="button" onClick={() => setQty((q) => Math.min(5, q + 1))} className="px-3 py-1.5 text-stone-600">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Delivery details */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
                    <input
                      required
                      inputMode="tel"
                      placeholder="Mobile, e.g. 0300 1234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={input}
                    />
                    <select required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input}>
                      <option value="">City</option>
                      {ALL_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input required placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} />
                  </div>

                  {/* Summary */}
                  <div className="space-y-1 rounded-xl bg-[var(--cream)] p-3 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{rs(subtotal)}</span></div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : rs(shipping)}</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-200 pt-1 font-semibold">
                      <span>Total · Cash on delivery</span>
                      <span>{rs(total)}</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      {form.city ? `Delivery in ${minDays}–${maxDays} working days after dispatch.` : "Choose your city to see delivery time."}
                      {shipping > 0 && " Free shipping from Rs 5,000."}
                    </div>
                  </div>

                  {tooBig && <p className="text-sm text-red-600">Cash on delivery is available up to {rs(COD_LIMIT)}. Please reduce the quantity.</p>}
                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    disabled={submitting || tooBig}
                    className="w-full rounded-full bg-[var(--brand)] py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {submitting ? "Placing your order…" : `Place order · ${rs(total)}`}
                  </button>
                  <p className="text-center text-[11px] text-stone-400">Demo store: no payment is taken and nothing is shipped.</p>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
