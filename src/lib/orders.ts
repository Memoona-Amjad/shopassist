// Places a demo order from the store page.
// Prices and stock always come from the database, never from the browser.
import { z } from "zod";
import { db } from "./supabase";
import { COD_LIMIT, deliveryWindow, shippingFor } from "./shipping";

export const LAST_SEED_ORDER_ID = 1042; // orders above this were placed by visitors

export const orderInputSchema = z.object({
  productId: z.string().min(1).max(20),
  size: z.string().min(1, "Please choose a size").max(20),
  qty: z.number().int().min(1, "Please choose a quantity").max(5, "You can order up to 5 of each item"),
  name: z.string().trim().min(2, "Please enter your name").max(60),
  phone: z.string().trim().min(10, "Please enter your mobile number").max(20),
  city: z.string().trim().min(2, "Please choose your city").max(40),
  address: z.string().trim().min(5, "Please enter your address").max(200),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

/** Accepts 03001234567, 0300-1234567 or +92 300 1234567 and returns 03001234567. */
export function normalizePakPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("92")) digits = "0" + digits.slice(2);
  return /^03\d{9}$/.test(digits) ? digits : null;
}

/** An error we can show to the customer as-is (bad input, sold out, ...). */
export class OrderError extends Error {}

export async function placeOrder(input: OrderInput) {
  const phone = normalizePakPhone(input.phone);
  if (!phone) throw new OrderError("Please enter a Pakistani mobile number, e.g. 0300 1234567.");

  const { data: product, error } = await db().from("products").select("*").eq("id", input.productId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!product) throw new OrderError("This product no longer exists.");
  if (!product.in_stock || product.stock <= 0) throw new OrderError("Sorry, this product is sold out.");
  if (input.qty > product.stock) throw new OrderError(`Only ${product.stock} left. Please reduce the quantity.`);
  if (!(product.sizes as string[]).includes(input.size)) throw new OrderError("Please choose an available size.");

  const subtotal = product.price * input.qty;
  const total = subtotal + shippingFor(subtotal);
  if (total > COD_LIMIT) {
    throw new OrderError(`Cash on delivery is available up to Rs ${COD_LIMIT.toLocaleString("en-US")}. Please reduce the quantity.`);
  }

  const row = {
    customer_name: input.name,
    phone,
    city: input.city,
    items: [{ productId: product.id, name: product.name, size: input.size, qty: input.qty, price: product.price }],
    total,
    payment: "COD",
    status: "processing",
    courier: null,
    tracking_no: null,
    ordered_at: new Date().toISOString(),
    shipped_at: null,
    delivered_at: null,
  };

  // Take the stock first, in one atomic database step, so two buyers can never
  // buy the last unit twice. If anything below fails, the stock is put back.
  const { data: left, error: stockError } = await db().rpc("take_stock", { p_product_id: product.id, p_qty: input.qty });
  if (stockError) throw new Error(stockError.message);
  if (left === null) throw new OrderError("Sorry, that item just sold out. Please choose a smaller quantity or another product.");
  const giveBack = () => db().rpc("give_back_stock", { p_product_id: product.id, p_qty: input.qty });

  // Next order number = highest + 1. If two people order at the same moment,
  // one insert fails on the primary key and simply retries with the next number.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: last } = await db().from("orders").select("id").order("id", { ascending: false }).limit(1);
    const id = Math.max(LAST_SEED_ORDER_ID, last?.[0]?.id ?? 0) + 1;
    const { error: insertError } = await db().from("orders").insert({ id, ...row });
    if (!insertError) {
      const [minDays, maxDays] = deliveryWindow(input.city);
      return { orderId: id, total, phoneLast4: phone.slice(-4), deliveryDays: `${minDays}–${maxDays}` };
    }
    if (insertError.code !== "23505") {
      await giveBack();
      throw new Error(insertError.message);
    } // 23505 = duplicate key: try the next number
  }
  await giveBack();
  throw new Error("Could not create an order number. Please try again.");
}
