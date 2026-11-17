// Browser check of /admin: login, dashboard, policy upload, delete.
// Usage: npx tsx --env-file=.env scripts/admin-check.mts <baseUrl> <outDir>
// (reads ADMIN_PASSWORD from the environment; never prints it)
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? ".";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
await page.fill('input[name="password"]', "definitely-wrong");
await page.click('button:has-text("Log in")');
await page.getByText("Wrong password.").waitFor({ timeout: 15_000 });
console.log("✓ wrong password rejected");

await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD ?? "");
await page.click('button:has-text("Log in")');
await page.getByText("Conversation logs").waitFor({ timeout: 20_000 });
console.log("✓ logged in");
await page.locator("details summary").first().click();
await page.screenshot({ path: `${out}/admin.png`, fullPage: true });

// Upload a test policy by pasting text.
await page.fill('input[name="name"]', "Test Loyalty Program");
await page.fill('textarea[name="text"]', "## Loyalty points\nCustomers earn 1 Lawn & Loom point for every Rs 100 spent. 500 points can be redeemed for Rs 500 off.");
await page.click('button:has-text("Upload and index")');
await page.getByText(/Indexed "Test Loyalty Program"/).waitFor({ timeout: 60_000 });
console.log("✓ policy uploaded and indexed");

if (process.argv.includes("--keep")) {
  console.log("(keeping the test policy)");
} else {
  await page.locator("li", { hasText: "test-loyalty-program.md" }).getByRole("button", { name: "Delete" }).click();
  await page.locator("li", { hasText: "test-loyalty-program.md" }).waitFor({ state: "detached", timeout: 20_000 });
  console.log("✓ test policy deleted");
}
console.log(errors.length ? `Browser errors:\n${errors.join("\n")}` : "No browser errors");
await browser.close();
