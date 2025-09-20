const { chromium } = require('playwright');
const fs = require('fs');

// Random delay (0–5 minutes) to avoid hitting site at exact schedule times
async function randomDelay() {
  const ms = Math.floor(Math.random() * 300000); // up to 300,000 ms (5 min)
  console.log(`⏳ Waiting ${Math.round(ms / 1000)} seconds before scraping...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  await randomDelay();

  const URL = 'https://getdaytrends.com/united-states/';

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`🌐 Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Click "See all 50"
    const button = await page.locator('text=See all 50').first();
    if (await button.isVisible()) {
      await button.click();
      await page.waitForLoadState('networkidle', { timeout: 60000 });
    }

    // Extract all trends
    const trends = await page.$$eval('a[href*="/trend/"]', els =>
      [...new Set(els.map(e => e.textContent.trim()).filter(Boolean))]
    );

    // Save results
    const data = {
      timestamp: new Date().toISOString(),
      count: trends.length,
      trends
    };
    fs.writeFileSync('latest_full50.json', JSON.stringify(data, null, 2));

    console.log(`✅ Saved ${trends.length} trends`);
    await browser.close();
  } catch (err) {
    console.error('❌ Scraper failed:', err);
    process.exit(1);
  }
})();
