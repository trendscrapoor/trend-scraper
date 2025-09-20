const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  let browser;
  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('➡️  Navigating…');
    await page.goto('https://getdaytrends.com/united-states/', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    const expand = page.getByText('See all 50', { exact: false }).first();
    if (await expand.isVisible().catch(() => false)) {
      console.log("🔘 Clicking 'See all 50'…");
      await expand.click();
      await page.waitForLoadState('networkidle', { timeout: 60_000 });
    } else {
      console.log("ℹ️  'See all 50' button not visible; continuing.");
    }

    console.log('📊 Extracting trends…');
    const trends = await page.$$eval('a[href*="/trend/"]', (els) => {
      const texts = els.map((e) => (e.textContent || '').trim()).filter(Boolean);
      return [...new Set(texts)];
    });

    const payload = {
      timestamp: new Date().toISOString(),
      count: trends.length,
      trends,
    };

    fs.writeFileSync('latest_full50.json', JSON.stringify(payload, null, 2));

    const historyDir = path.join(__dirname, '..', '..', 'history');
    fs.mkdirSync(historyDir, { recursive: true });
    const ts = payload.timestamp.replace(/:/g, '-');
    const historyPath = path.join(historyDir, `${ts}.json`);
    fs.writeFileSync(historyPath, JSON.stringify(payload, null, 2));

    console.log(`✅ Saved ${trends.length} trends`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Scraper failed:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
