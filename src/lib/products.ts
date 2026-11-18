// Products for the store page, read from the database (live stock + photos).
// The result is cached and tagged "products"; admin changes and new orders
// expire the tag, so the store updates straight away.
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./supabase";
import { PRODUCTS, type Product } from "./seed-data";

export const PRODUCTS_TAG = "products";
export const IMAGE_BUCKET = "product-images";

export async function getStoreProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");
  try {
    const { data, error } = await db().from("products").select("*").order("id");
    if (error) throw new Error(error.message);
    if (data && data.length > 0) return data as Product[];
  } catch (error) {
    // The store should never be empty: fall back to the built-in catalogue.
    console.error("Could not load products, using the seed catalogue:", error);
  }
  return PRODUCTS;
}

/** Creates the public storage bucket for product photos if it does not exist yet. */
export async function ensureImageBucket() {
  const storage = db().storage;
  const { data } = await storage.getBucket(IMAGE_BUCKET);
  if (data) return;
  const { error } = await storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: "2MB",
    allowedMimeTypes: ["image/webp", "image/jpeg", "image/png"],
  });
  if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
}
