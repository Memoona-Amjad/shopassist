"use server";
// Owner actions for products: stock levels and product photos.
// Every action checks the admin cookie first.
import { refresh, updateTag } from "next/cache";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { IMAGE_BUCKET, PRODUCTS_TAG, ensureImageBucket } from "@/lib/products";

export type ProductActionState = { ok?: boolean; message?: string };

const MAX_IMAGE_BYTES = 1_500_000; // images are compressed in the browser first
const IMAGE_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/** Set the number of units in stock (0 = sold out). */
export async function setStock(productId: string, stock: number): Promise<ProductActionState> {
  if (!(await isAdmin())) return { ok: false, message: "Please log in again." };
  if (!Number.isInteger(stock) || stock < 0 || stock > 9999) return { ok: false, message: "Stock must be a whole number from 0 to 9999." };
  const { error } = await db().from("products").update({ stock, in_stock: stock > 0 }).eq("id", productId);
  if (error) return { ok: false, message: "Could not save. Please try again." };
  updateTag(PRODUCTS_TAG); // the store shows the change immediately
  refresh(); // and this admin page re-renders with the new value
  return { ok: true, message: stock === 0 ? "Marked as sold out" : `Stock set to ${stock}` };
}

/** Upload (or replace) a product photo. */
export async function uploadProductImage(formData: FormData): Promise<ProductActionState> {
  if (!(await isAdmin())) return { ok: false, message: "Please log in again." };
  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image first." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, message: "Please use a JPG, PNG or WebP image." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: "Image is too big (max 1.5 MB after compression)." };

  try {
    await ensureImageBucket();
    const storage = db().storage.from(IMAGE_BUCKET);
    // A new file name each time, so browsers and CDNs never show an old cached photo.
    const path = `${productId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (uploadError) throw new Error(uploadError.message);
    const publicUrl = storage.getPublicUrl(path).data.publicUrl;

    const { data: old } = await db().from("products").select("image_url").eq("id", productId).single();
    const { error } = await db().from("products").update({ image_url: publicUrl }).eq("id", productId);
    if (error) throw new Error(error.message);
    await removeStoredFile(old?.image_url); // tidy up the previous photo
    updateTag(PRODUCTS_TAG);
    refresh();
    return { ok: true, message: "Photo saved" };
  } catch (error) {
    console.error("Image upload failed:", error);
    return { ok: false, message: "Upload failed. Please try again." };
  }
}

/** Remove a product photo (the store falls back to the fabric swatch). */
export async function removeProductImage(productId: string): Promise<ProductActionState> {
  if (!(await isAdmin())) return { ok: false, message: "Please log in again." };
  const { data: old } = await db().from("products").select("image_url").eq("id", productId).single();
  const { error } = await db().from("products").update({ image_url: null }).eq("id", productId);
  if (error) return { ok: false, message: "Could not remove the photo." };
  await removeStoredFile(old?.image_url);
  updateTag(PRODUCTS_TAG);
  refresh();
  return { ok: true, message: "Photo removed" };
}

async function removeStoredFile(url: string | null | undefined) {
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  if (!url || !url.includes(marker)) return;
  await db().storage.from(IMAGE_BUCKET).remove([url.split(marker)[1]]).catch(() => {});
}
