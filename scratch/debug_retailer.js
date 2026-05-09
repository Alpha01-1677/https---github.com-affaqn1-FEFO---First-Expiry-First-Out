const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`PAGE LOG: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:8081/index.html');
    
    // In index.html, retailer is in supervisor tab
    await page.click('#tab-supervisor');
    
    await page.fill('#login-email', 'retailer1@nestle.com');
    await page.fill('#login-password', 'nestle123');
    await page.click('#login-btn');

    await page.waitForURL('**/retailer_portal.html', { timeout: 10000 });
    console.log('Successfully logged in');

    // Wait for Firestore to load
    await page.waitForTimeout(5000);
    
    const containerHtml = await page.innerHTML('#offers-container');
    console.log('Offers Container Inner HTML length:', containerHtml.trim().length);
    
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
  }
})();
