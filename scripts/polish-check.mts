// Visual check of the customer-facing site: home, policy page, 404, and a chat
// answer with the "what I did" steps line (collapsed and expanded).
// Usage: npx tsx scripts/polish-check.mts <baseUrl> <outDir>
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? ".";
const browser = await chromium.launch();
const errors: string[] = [];

for (const [name, width] of [["desktop", 1280], ["phone", 390]] as const) {
  const page = await browser.newPage({ viewport: { width, height: 860 }, extraHTTPHeaders: process.env.UI_FAKE_IP ? { "x-forwarded-for": process.env.UI_FAKE_IP } : {} });
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${name}: ${m.text().slice(0, 160)}`));
  await page.goto(base, { waitUntil: "load" });
  await page.getByRole("button", { name: /open chat/i }).waitFor();
  await page.screenshot({ path: `${out}/${name}-home.png`, fullPage: true });
  await page.goto(`${base}/policies/sizing`, { waitUntil: "load" });
  await page.screenshot({ path: `${out}/${name}-policy.png`, fullPage: true });
  await page.goto(`${base}/no-such-page`, { waitUntil: "load" });
  await page.screenshot({ path: `${out}/${name}-404.png` });
  await page.close();
}

// Chat: the question from the customer's feedback.
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: process.env.UI_FAKE_IP ? { "x-forwarded-for": process.env.UI_FAKE_IP } : {} });
await page.goto(base, { waitUntil: "load" });
await page.getByRole("button", { name: /open chat/i }).click();
await page.getByRole("dialog", { name: "ShopAssist chat" }).screenshot({ path: `${out}/chat-welcome.png` });
await page.getByLabel("Your message").fill("What sizes does the Chambeli Everyday Lawn Suit come in? Show me the measurements.");
await page.getByRole("button", { name: "Send" }).click();
await page.getByRole("button", { name: "Stop" }).waitFor({ state: "detached", timeout: 120_000 });
await page.waitForTimeout(500);
await page.getByRole("dialog", { name: "ShopAssist chat" }).screenshot({ path: `${out}/chat-answer.png` });
await page.getByRole("button", { name: /see steps/ }).first().click();
await page.getByRole("dialog", { name: "ShopAssist chat" }).screenshot({ path: `${out}/chat-steps.png` });
console.log(errors.length ? `Browser errors:\n${[...new Set(errors)].join("\n")}` : "No browser errors");
await browser.close();
