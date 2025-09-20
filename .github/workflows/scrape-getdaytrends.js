const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("🚀 Starting scraper...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("🌐 Navigating to getdaytrends...");
    await page.goto("https://getdaytrends.com/united-states/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Click "See all 50" if button is present
    const button = await page.locator("text=See all 50").first();
    if (await button.isVisible()) {
      console.log("👉 Clicking 'See all 50'...");
      await button.click();
      await page.waitForLoadState("networkidle");
    }

    console.log("📊 Extracting trends...");
    let trends = await page.$$eval("a[href*='/trend/']", els =>
      els.map(e => e.textContent.trim()).filter(Boolean)
    );

    // Enforce exactly 50
    if (trends.length > 50) {
      trends = trends.slice(0, 50);
    }

    const data = {
      timestamp: new Date().toISOString(),
      count: trends.length,
      trends,
    };

    // Save latest snapshot
    fs.writeFileSync("latest_full50.json", JSON.stringify(data, null, 2));

    // Save historical copy
    const historyDir = path.join(__dirname, "../../history");
    if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });
    const fileName = path.join(historyDir, `${new Date().toISOString()}.json`);
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));

    console.log(`✅ Saved ${trends.length} trends`);
  } catch (err) {
    console.error("❌ Scraper failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
