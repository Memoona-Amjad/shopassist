// Browser check of the ordering flow: click a product, fill the form, place the
// order, then track it with ShopAssist. Usage: npx tsx scripts/order-check.mts <baseUrl> <outDir>
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? ".";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(process.env.UI_WIDTH ?? 1280), height: 900 },
  extraHTTPHeaders: process.env.UI_FAKE_IP ? { "x-forwarded-for": process.env.UI_FAKE_IP } : {},
});
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));

await page.goto(base, { waitUntil: "load" });
await page.getByRole("button", { name: /chat with us/i }).waitFor(); // page is interactive

// Filter to kurtas and click a product card.
await page.getByRole("button", { name: /^Kurtas \d+$/ }).click();
await page.getByRole("button", { name: "View Ayesha A-line Lawn Kurta" }).click();
const dialog = page.getByRole("dialog");
await dialog.waitFor();
console.log("✓ clicking a product opens the order form");

// Try to submit without a size -> friendly error.
await dialog.getByLabel("Full name").fill("Sara Ahmed");
await dialog.getByLabel("Mobile number").fill("0321 7654321");
await dialog.getByLabel("City").selectOption("Karachi");
await dialog.getByLabel("Address").fill("House 12, Block 5, Clifton");
await dialog.getByRole("button", { name: /Place order/ }).click();
await dialog.getByText("Please choose a size.").waitFor();
console.log("✓ missing size is caught");

await dialog.getByRole("button", { name: "M", exact: true }).click();
await dialog.getByRole("button", { name: "More" }).click(); // qty 2 -> Rs 4,980 + shipping
await page.screenshot({ path: `${out}/order-form.png` });
await dialog.getByRole("button", { name: /Place order/ }).click();
await dialog.getByText(/Order #\d+ placed!/).waitFor({ timeout: 20_000 });
const title = await dialog.getByText(/Order #\d+ placed!/).innerText();
console.log(`✓ ${title}`);
await page.screenshot({ path: `${out}/order-success.png` });

// Track it with the agent.
await dialog.getByRole("button", { name: /Track it with ShopAssist/ }).click();
await page.getByRole("button", { name: "Stop" }).waitFor({ timeout: 15_000 }).catch(() => {});
await page.getByRole("button", { name: "Stop" }).waitFor({ state: "detached", timeout: 120_000 });
await page.waitForTimeout(500);
const chip = await page.locator("div.fixed").getByText(/Checked order #\d+/).innerText().catch(() => "(no chip)");
console.log(`✓ agent chip: ${chip}`);
await page.screenshot({ path: `${out}/order-tracked.png` });

console.log(errors.length ? `Browser errors:\n${errors.join("\n")}` : "No browser errors");
await browser.close();
