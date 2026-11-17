// Quick check that policy search returns sensible chunks.
// Run with: npx tsx --env-file=.env scripts/check-rag.ts "your question"
import { searchPolicyChunks } from "../src/lib/rag";

const questions = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["What is your return policy?", "Do you deliver to Quetta and how long?", "Can I pay cash on delivery?", "What is the chest size for medium?", "Do you sell laptops?"];

(async () => {
  for (const q of questions) {
    const hits = await searchPolicyChunks(q);
    console.log(`\nQ: ${q}`);
    for (const h of hits) console.log(`   ${h.similarity}  ${h.source} > ${h.heading}`);
    if (!hits.length) console.log("   (no matches)");
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
