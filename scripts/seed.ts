// Seeds the Supabase database with the demo store and indexes the policy docs.
// Run with:  npm run seed                     (products, orders and policy docs)
//            npm run seed -- --no-docs         (skip the embeddings step)
//            npm run seed -- --reset-stock     (also put every product's stock back to the demo levels;
//                                               product photos are kept)
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { resetStoreData } from "../src/lib/demo-reset";
import { ingestDocument } from "../src/lib/rag";
import { PRODUCTS } from "../src/lib/seed-data";
import { db } from "../src/lib/supabase";

async function main() {
  if (process.argv.includes("--reset-stock")) {
    // Only the listed columns are updated, so uploaded photos (image_url) stay.
    const rows = PRODUCTS.map(({ id, stock, in_stock }) => ({ id, stock, in_stock }));
    for (const row of rows) {
      const { error } = await db().from("products").update({ stock: row.stock, in_stock: row.in_stock }).eq("id", row.id);
      if (error) throw new Error(`Stock for ${row.id}: ${error.message}`);
    }
    console.log(`  ✓ stock reset for ${rows.length} products`);
  }

  console.log("Seeding products and orders...");
  const counts = await resetStoreData();
  console.log(`  ✓ ${counts.products} products, ${counts.orders} orders`);

  if (process.argv.includes("--no-docs")) return;

  console.log("Embedding policy documents...");
  const dir = path.join(process.cwd(), "data", "policies");
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".md"))) {
    const markdown = await readFile(path.join(dir, file), "utf8");
    const result = await ingestDocument(file, markdown);
    console.log(`  ✓ ${file}: ${result.chunks} chunks`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("\nSeed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
