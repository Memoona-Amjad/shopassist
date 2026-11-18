import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import type { Product } from "@/lib/seed-data";
import { LoginForm } from "../forms";
import { ProductManager } from "./product-manager";

export const metadata: Metadata = { title: "Products & stock · ShopAssist" };

export default function ProductsAdminPage() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">Loading products…</p>}>
      <ProductsContent />
    </Suspense>
  );
}

async function ProductsContent() {
  if (!(await isAdmin())) return <LoginForm />;
  // The owner always sees fresh data (no cache).
  const { data, error } = await db().from("products").select("*").order("id");
  if (error) {
    console.error("Products load failed:", error);
    return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Could not load products. Please refresh in a moment.</p>;
  }
  return <ProductManager products={(data ?? []) as Product[]} />;
}
