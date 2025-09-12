const { chromium } = require('playwright');
const fs = require('fs');

const URL = 'https://getdaytrends.com/united-states/';

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    // Click "See all 50"
    const button = await page.locator('text=See all 50').first();
    if (await button.isVisible()) {
      await button.click();
      await page.waitForLoadState('networkidle');
    }

    // Extract all trends
    const trends = await page.$$eval('a[href*="/trend/"]', els =>
      [...new Set(els.map(e => e.textContent.trim()).filter(Boolean))]
    );

    fs.writeFileSync('latest_full50.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      count: trends.length,
      trends
    }, null, 2));

    console.log(`✅ Saved ${trends.length} trends`);
    await browser.close();
  } catch (err) {
    console.error("❌ Scraper failed:", err);
    process.exit(1);
  }
})();
