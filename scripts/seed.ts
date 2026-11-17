// Seeds the Supabase database with the demo store and indexes the policy docs.
// Run with:  npm run seed            (products, orders and policy docs)
//            npm run seed -- --no-docs  (skip the embeddings step)
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { resetStoreData } from "../src/lib/demo-reset";
import { ingestDocument } from "../src/lib/rag";

async function main() {
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
