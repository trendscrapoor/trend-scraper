const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log("🚀 Starting scraper...");

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log("🌐 Navigating to getdaytrends...");
    await page.goto('https://getdaytrends.com/united-states/', { waitUntil: 'domcontentloaded' });

    // Click "See all 50" if visible
    const button = await page.locator('text=See all 50').first();
    if (await button.isVisible()) {
      console.log("👆 Clicking 'See all 50'...");
      await button.click();
      await page.waitForLoadState('networkidle');
    }

    // Extract all trends
    console.log("📊 Extracting trends...");
    const trends = await page.$$eval('a[href*="/trend/"]', els =>
      [...new Set(els.map(e => e.textContent.trim()).filter(Boolean))]
    );

    console.log(`✅ Saved ${trends.length} trends`);

    // Prepare output
    const output = {
      timestamp: new Date().toISOString(),
      count: trends.length,
      trends
    };

    // Ensure history directory exists
    const historyDir = path.join(__dirname, '../../history');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }

    // Write to latest + history file
    fs.writeFileSync(
      path.join(__dirname, '../../latest_full50.json'),
      JSON.stringify(output, null, 2)
    );

    const historyFile = path.join(historyDir, `${output.timestamp}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(output, null, 2));

    await browser.close();
  } catch (err) {
    console.error("❌ Scraper failed:", err);
    process.exit(1);
  }
})();
