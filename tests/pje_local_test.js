// Playwright test script for local PJE1 test page
// Usage (after installing playwright):
//   npx playwright install
//   node tests/pje_local_test.js

const { chromium } = require('playwright');

(async () => {
  const url = process.env.PJE_LOCAL_URL || 'http://localhost:8080/Painel%20do%20Advogado%20%C2%B7%20Tribunal%20de%20Justi%C3%A7a%20do%20Estado%20da%20Bahia.html';
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Example checks: adapt selectors to the page structure
  try {
    // Wait for the main panel or a known selector
    await page.waitForSelector('body', { timeout: 5000 });
    console.log('Page loaded');

    // Example: check for an element that represents the user panel
    const exists = await page.$('text=Painel do Advogado') || await page.$('h1');
    if (exists) console.log('Found expected panel elements');
    else console.warn('Expected elements not found — adjust selectors');

    // Insert additional interactions here to simulate the extractor steps
    // e.g. fill login fields, click buttons (if present on the static page)

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    // keep browser open for inspection in non-headless mode; close after short delay
    setTimeout(async () => { await browser.close(); }, 4000);
  }
})();
