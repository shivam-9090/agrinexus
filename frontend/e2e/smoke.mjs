// Manual end-to-end smoke check driving a real browser against the running
// dev servers. Not part of `npm test` (needs a live backend + frontend + a
// local Chrome install) -- run it yourself before a demo:
//
//   # terminal 1
//   cd backend && source .venv/bin/activate && uvicorn app.main:app --port 8123
//   # terminal 2
//   cd frontend && VITE_API_URL=http://127.0.0.1:8123/api/v1 npm run dev -- --port 5173
//   # terminal 3
//   node e2e/smoke.mjs
//
// Screenshots land in frontend/e2e/screenshots/ (gitignored).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screenshots");
mkdirSync(OUT, { recursive: true });

const BASE_URL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5173/";
const CHROME_PATH = process.env.SMOKE_CHROME_PATH || "/usr/bin/google-chrome";

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/1_advisory_empty.png` });

  await page.getByRole("button", { name: /get regenerative advisory/i }).click();
  await page.waitForSelector("text=Recommended crops", { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/2_advisory_results.png`, fullPage: true });

  const phInput = page.locator('xpath=//label[span[normalize-space(text())="pH"]]/input');
  await phInput.fill("99");
  await page.getByRole("button", { name: /get regenerative advisory/i }).click();
  await page.waitForSelector("text=pH must be between");
  await page.screenshot({ path: `${OUT}/3_validation_error.png` });
  await phInput.fill("6.5");

  await page.getByRole("button", { name: /leaf diagnostics/i }).click();
  await page.waitForSelector("text=Crop leaf stress diagnostic");
  await page.screenshot({ path: `${OUT}/4_disease_tab.png` });

  await page.getByRole("button", { name: /brics cooperation/i }).click();
  await page.waitForSelector("text=BRICS cooperation network");
  await page.getByRole("button", { name: /simulate brics network sync/i }).click();
  await page.waitForSelector("text=India");
  await page.screenshot({ path: `${OUT}/5_cooperation_synced.png`, fullPage: true });

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error("Browser console errors detected:", consoleErrors);
    process.exit(1);
  }
  console.log(`OK - screenshots written to ${OUT}`);
}

main().catch((err) => {
  console.error("Smoke check failed:", err);
  process.exit(1);
});
