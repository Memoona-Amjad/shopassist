import { Suspense } from "react";
import { DemoPanel } from "@/components/store/DemoPanel";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/ProductGrid";
import { swatchStyle } from "@/components/store/swatch";
import { getStoreProducts } from "@/lib/products";
import { PRODUCTS } from "@/lib/seed-data";

// The storefront. Products (stock + photos) come from the database through a
// cached loader; if the database is down it falls back to the built-in catalogue.
// Orders placed here are checked and priced on the server (/api/orders).

async function StoreProducts() {
  return <ProductGrid products={await getStoreProducts()} />;
}

const HERO_PICKS = ["LL-101", "LL-102", "LL-104", "LL-108", "LL-109", "LL-110"].map((id) => PRODUCTS.find((p) => p.id === id)!);

const PROMISES = [
  { icon: "🚚", title: "Delivery across Pakistan", text: "2–3 days in major cities. Free from Rs 5,000." },
  { icon: "💵", title: "Cash on delivery", text: "Pay the rider when your parcel arrives." },
  { icon: "↩️", title: "14-day easy returns", text: "Free pickup from your door." },
  { icon: "💬", title: "Help 24/7", text: "Our AI assistant answers instantly, and a person is one message away." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--brand)] text-white">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              "radial-gradient(circle at 25% 30%, #f4c9a8 0 3%, transparent 4%) 0 0/60px 60px, radial-gradient(circle at 70% 70%, #ffffff 0 2%, transparent 3%) 0 0/40px 40px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">Summer Lawn ’26 · New arrivals</p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.1] sm:text-6xl">Breezy prints for long summer days.</h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-emerald-50/90">
              Unstitched 3-piece lawn suits, everyday kurtas and festive formals, delivered across Pakistan with cash on delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#shop" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand)] shadow-lg transition hover:bg-emerald-50">
                Shop the collection
              </a>
              <a href="#assistant" className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                💬 Meet our AI assistant
              </a>
            </div>
          </div>
          <div className="hidden justify-center lg:flex" aria-hidden>
            {/* Three columns of two tiles; the middle column sits lower for a staggered look. */}
            <div className="flex gap-3.5">
              {[0, 1, 2].map((col) => (
                <div key={col} className={`flex flex-col gap-3.5 ${col === 1 ? "mt-10" : ""}`}>
                  {HERO_PICKS.slice(col * 2, col * 2 + 2).map((p) => (
                    <div key={p.id} className="relative h-44 w-32 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10" style={swatchStyle(p)}>
                      <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/90 px-2 py-0.5 text-center text-[10px] font-medium text-stone-700">
                        {p.name.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Store promises */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {PROMISES.map((p) => (
            <div key={p.title} className="flex gap-3">
              <span className="text-2xl" aria-hidden>{p.icon}</span>
              <div>
                <div className="text-sm font-semibold text-stone-900">{p.title}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-stone-500">{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Meet ShopAssist (try with sample data) */}
      <DemoPanel />

      {/* Products (click one to order) */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <StoreProducts />
      </Suspense>
    </>
  );
}
