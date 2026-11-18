// Browser check of the store UI and the admin "Products & stock" page:
// hover/badges, product view, photo upload + removal, sold out + restock.
// Usage: npx tsx --env-file=.env scripts/products-check.mts <baseUrl> <outDir>
// (reads ADMIN_PASSWORD from the environment; never prints it)
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? ".";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));

// 1. Make a test photo (a rendered gradient) to upload.
const photoPath = `${out}/test-photo.png`;
await page.setContent(`<div id="p" style="width:600px;height:750px;background:linear-gradient(135deg,#f6d3c4,#c2603f);display:flex;align-items:center;justify-content:center;font:bold 48px sans-serif;color:white">TEST PHOTO</div>`);
await page.locator("#p").screenshot({ path: photoPath });

// 2. Admin: log in, open Products & stock.
await page.goto(`${base}/admin/products`, { waitUntil: "load" });
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD ?? "");
await page.click('button:has-text("Log in")');
await page.getByRole("heading", { name: "Products & stock" }).waitFor({ timeout: 20_000 });
console.log("✓ products page loads after login");
await page.screenshot({ path: `${out}/admin-products.png`, fullPage: true });

const row = (id: string) => page.locator("div.rounded-2xl", { has: page.getByText(id, { exact: true }) }).last();

// Upload a photo for LL-101.
await row("LL-101").locator('input[type="file"]').setInputFiles(photoPath);
await row("LL-101").getByText("Photo saved").waitFor({ timeout: 30_000 });
await row("LL-101").getByRole("button", { name: "Remove photo" }).waitFor({ timeout: 10_000 });
console.log("✓ photo uploaded (compressed in the browser, stored in Supabase Storage)");

// Mark LL-103 sold out.
await row("LL-103").getByRole("button", { name: "Mark sold out" }).click();
await row("LL-103").getByText("Marked as sold out").waitFor({ timeout: 15_000 });
console.log("✓ LL-103 marked sold out");

// 3. Store reflects the changes (on Vercel the cache refresh can take a second or two).
for (let attempt = 0; attempt < 6; attempt++) {
  await page.goto(base, { waitUntil: "load" });
  const ready = await page.locator("article", { hasText: "Chambeli Everyday Lawn Suit" }).getByText("Sold out").count();
  if (ready) break;
  await page.waitForTimeout(2000);
}
await page.locator("#shop").scrollIntoViewIfNeeded();
const gulnar = page.locator("article", { hasText: "Gulnar Printed Lawn Suit" });
const hasPhoto = await gulnar.locator("img").count();
console.log(hasPhoto ? "✓ store shows the uploaded photo" : "✗ store does NOT show the photo");
const chambeli = page.locator("article", { hasText: "Chambeli Everyday Lawn Suit" });
console.log((await chambeli.getByText("Sold out").count()) ? "✓ store shows LL-103 as sold out" : "✗ sold out badge missing");
console.log((await page.getByText(/Only \d+ left/).count()) ? "✓ low-stock badges visible" : "✗ no low-stock badges");

// Hover: the category label must stay visible (not covered).
await gulnar.locator("button").first().hover();
await page.waitForTimeout(400);
await gulnar.screenshot({ path: `${out}/card-hover.png` });
await page.locator("#shop").screenshot({ path: `${out}/store-grid.png` });

// Product view.
await gulnar.locator("button").first().click();
await page.getByRole("dialog").waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/product-view.png` });
await page.keyboard.press("Escape");

// 4. Clean up: remove the test photo and restock LL-103.
await page.goto(`${base}/admin/products`, { waitUntil: "load" });
await page.getByRole("heading", { name: "Products & stock" }).waitFor();
await row("LL-101").getByRole("button", { name: "Remove photo" }).click();
await row("LL-101").getByText("Photo removed").waitFor({ timeout: 15_000 });
await row("LL-103").getByRole("button", { name: /Restock/ }).click();
await row("LL-103").getByText(/Stock set to/).waitFor({ timeout: 15_000 });
console.log("✓ cleanup: photo removed, LL-103 restocked");

console.log(errors.length ? `Browser errors:\n${[...new Set(errors)].join("\n")}` : "No browser errors");
await browser.close();
