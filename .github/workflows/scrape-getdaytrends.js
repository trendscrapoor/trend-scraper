const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  let browser;
  try {
    console.log("🌐 Launching browser...");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://getdaytrends.com/united-states/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Click "See all 50"
    const button = page.locator('text=See all 50').first();
    if (await button.isVisible()) {
      await button.click();
      await page.waitForLoadState('networkidle', { timeout: 60000 });
    }

    // Extract all trends
    const trends = await page.$$eval('a[href*="/trend/"]', els =>
      [...new Set(els.map(e => e.textContent.trim()).filter(Boolean))]
    );

    const out = {
      timestamp: new Date().toISOString(),
      count: trends.length,
      trends
    };

    // Always update latest_full50.json
    fs.writeFileSync('latest_full50.json', JSON.stringify(out, null, 2));

    // Also archive into history folder
    const historyDir = path.join(__dirname, '..', '..', 'history');
    if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir);

    const timestamp = new Date().toISOString().replace(/[:]/g, '-');
    const historyFile = path.join(historyDir, `${timestamp}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(out, null, 2));

    console.log(`✅ Saved ${trends.length} trends`);
    process.exit(0);

  } catch (err) {
    console.error("❌ Scraper failed:", err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
