const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("🌍 Navigating to GetDayTrends...");
    await page.goto("https://getdaytrends.com/united-states/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Click "See all 50" if available
    const button = await page.locator("text=See all 50").first();
    if (await button.isVisible()) {
      await button.click();
      await page.waitForLoadState("networkidle", { timeout: 30000 });
    }

    // Extract all unique trends
    const trends = await page.$$eval('a[href*="/trend/"]', els =>
      [...new Set(els.map(e => e.textContent.trim()).filter(Boolean))]
    );

    // Save to JSON file
    const data = {
      timestamp: new Date().toISOString(),
      count: trends.length,
      trends,
    };

    fs.writeFileSync(
      "latest_full50.json",
      JSON.stringify(data, null, 2)
    );

    console.log(`✅ Saved ${trends.length} trends`);
  } catch (err) {
    console.error("❌ Scraper failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
