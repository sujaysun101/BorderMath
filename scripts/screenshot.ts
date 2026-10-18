import { chromium } from "playwright";

const base = process.env.SCREENSHOT_URL || "http://127.0.0.1:3000";

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const landingTitle = await page.title();
  if (!landingTitle.includes("BorderMath") || landingTitle.includes("Google AI Studio")) {
    throw new Error(`Unexpected landing title: ${landingTitle}`);
  }
  await page.screenshot({ path: "public/portfolio-screenshot-landing.png" });

  await page.goto(`${base}/demo/dashboard`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='schengen-chart']");
  const appTitle = await page.title();
  if (!appTitle.includes("BorderMath") || appTitle.includes("Google AI Studio")) {
    throw new Error(`Unexpected app title: ${appTitle}`);
  }
  await page.screenshot({ path: "public/portfolio-screenshot.png" });
  await browser.close();
  console.log("Wrote public/portfolio-screenshot.png and public/portfolio-screenshot-landing.png");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
