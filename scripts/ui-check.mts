// Opens the site in a headless browser, clicks demo prompts in the chat widget,
// and saves screenshots. Usage: npx tsx scripts/ui-check.mts <baseUrl> <outDir> [prompt index...]
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? ".";
const indexes = process.argv.slice(4).map(Number);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(base, { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/home.png` });
await page.getByRole("button", { name: /chat with us/i }).first().click();
await page.screenshot({ path: `${out}/widget-open.png` });

for (const i of indexes.length ? indexes : [0]) {
  const prompts = page.locator("button", { hasText: /order #1042|return order #1037|lawn suits|return policy|third time/ });
  await prompts.nth(i).click();
  // Wait until the agent has finished (Send button comes back).
  await page.getByRole("button", { name: "Send" }).waitFor({ timeout: 90_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/prompt-${i}.png` });
  await page.getByRole("button", { name: "New chat" }).click();
}
console.log(errors.length ? `Browser errors:\n${errors.join("\n")}` : "No browser errors");
await browser.close();
