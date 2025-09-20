const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  try {
    console.log("🌐 Launching browser...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log("➡️ Navigating to GetDayTrends...");
    await page.goto("https://getdaytrends.com/united-states/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Click "See all 50" if available
    const button = await page.locator("text=See all 50").first();
    if (await button.isVisible()) {
      console.log("🔘 Clicking 'See all 50'...");
      await button.click();
      await page.waitForLoadState("networkidle", { timeout: 60000 });
    }

    // Extract all trends
    console.log("📊 Extracting trends...");
    const trends = await page.$$eval('a[href*="/trend/"]', (els) =>
      [...new Set(els.map((e) => e.textContent.trim()).filter(Boolean))]
    );

    const output = {
      timestamp: new Date().toISOString(),
      count: trends.length,
      trends,
    };

    fs.writeFileSync("latest_full50.json", JSON.stringify(output, null, 2));
    console.log(`✅ Saved ${trends.length} trends`);

    await browser.close();
  } catch (err) {
    console.error("❌ Scraper failed:", err);
    process.exit(1);
  }
})();
