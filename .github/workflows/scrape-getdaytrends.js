const { chromium } = require('playwright');
const fs = require('fs');

const URL = 'https://getdaytrends.com/united-states/';

// Helper: wait for given ms
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  try {
    // Random delay up to 5 minutes
    const delay = Math.floor(Math.random() * 300_000); // 0–300,000 ms
    console.log(`⏳ Waiting ${Math.round(delay / 1000)} seconds before scraping...`);
    await sleep(delay);

    console.log("🚀 Starting scraper");

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    // Click "See all 50" if it exists
    const button = await page.locator('text=See all 50').first();
    if (await button.isVisible()) {
      await button.click();
      await page.waitForLoadState('networkidle');
    }

    // Extract all trends
    const trends = await page.$$eval('a[href*="/trend/"]', els =>
      [...new Set(els.map(e => e.textContent.trim()).filter(Boolean))]
    );

    // Save to JSON
    fs.writeFileSync(
      'latest_full50.json',
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          count: trends.length,
          trends
        },
        null,
        2
      )
    );

    console.log(`✅ Saved ${trends.length} trends`);
    await browser.close();
  } catch (err) {
    console.error("❌ Scraper failed:", err);
    process.exit(1);
  }
})();
