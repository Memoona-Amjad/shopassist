// Re-creates the README screenshots (store page, a full return conversation, admin).
// Usage: npx tsx --env-file=.env scripts/readme-shots.mts <baseUrl>
// Note: this places a real return for #1037; reset demo data afterwards (npm run seed -- --no-docs).
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1700 }, extraHTTPHeaders: { "x-forwarded-for": "198.51.100.250" } });
await page.goto(base, { waitUntil: "load" });
await page.getByRole("button", { name: /open chat/i }).waitFor();
await page.setViewportSize({ width: 1280, height: 860 });
await page.screenshot({ path: "docs/images/store-page.png" });
await page.setViewportSize({ width: 1280, height: 1700 });

const chat = page.getByRole("dialog", { name: "ShopAssist chat" });
const done = () => page.getByRole("button", { name: "Stop" }).waitFor({ state: "detached", timeout: 120_000 });
const send = async (text: string) => {
  await page.getByLabel("Your message").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
  await done();
  await page.waitForTimeout(500);
};
await page.getByRole("button", { name: /open chat/i }).click();
await send("I want to return order #1037");
await send("Phone ends 5590. The colour didn't suit me");
await send("Yes, please go ahead");
await chat.getByRole("button", { name: /see steps/ }).last().click();
// Let the panel grow so the whole conversation fits in one image.
await page.evaluate(() => {
  const panel = document.querySelector('[aria-label="ShopAssist chat"]') as HTMLElement;
  panel.style.height = "auto";
  panel.style.maxHeight = "none";
  (panel.querySelector(".overflow-y-auto") as HTMLElement).style.overflow = "visible";
});
await chat.screenshot({ path: "docs/images/chat-return-flow.png" });

await page.goto(`${base}/admin`, { waitUntil: "load" });
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD ?? "");
await page.click('button:has-text("Log in")');
await page.getByText("Conversation logs").waitFor({ timeout: 20_000 });
await page.setViewportSize({ width: 1280, height: 860 });
await page.screenshot({ path: "docs/images/admin-dashboard.png" });
await browser.close();
console.log("README screenshots updated");
