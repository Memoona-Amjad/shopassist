// Puts products and orders back to their demo state.
// Used by the seed script and by the daily reset (so dates stay fresh
// and order #1037 can always be returned in the demo).
import { db } from "./supabase";
import { PRODUCTS, buildOrders, orderToRow } from "./seed-data";
import { LAST_SEED_ORDER_ID } from "./orders";

export async function resetStoreData() {
  const supabase = db();

  const { error: productError } = await supabase.from("products").upsert(PRODUCTS);
  if (productError) throw new Error(`Products: ${productError.message}`);

  // Returns reference orders, so clear them first.
  const { error: returnsError } = await supabase.from("returns").delete().gte("id", 0);
  if (returnsError) throw new Error(`Returns: ${returnsError.message}`);

  // Remove orders that visitors placed from the store page (numbers above the seed orders).
  const { error: visitorError } = await supabase.from("orders").delete().gt("id", LAST_SEED_ORDER_ID);
  if (visitorError) throw new Error(`Visitor orders: ${visitorError.message}`);

  const rows = buildOrders().map((o) => orderToRow(o));
  const { error: orderError } = await supabase.from("orders").upsert(rows);
  if (orderError) throw new Error(`Orders: ${orderError.message}`);

  return { products: PRODUCTS.length, orders: rows.length };
}
