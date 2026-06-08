const { test, expect } = require('@playwright/test');

// ──────────────────────────────────────────────────────────────────────────────
// Helper: UI Login via the real login form
// Uses waitForURL with a generous timeout to handle Firebase auth latency.
// ──────────────────────────────────────────────────────────────────────────────
async function uiLogin(page, email, password, role) {
  await page.goto('/index.html');

  // Use robust IDs for tab selection
  if (role === 'Warehouse Staff') {
    await page.click('#tab-staff');
  } else {
    await page.click('#tab-supervisor');
  }

  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('#login-btn');

  // Optional: check for immediate error message
  const errorEl = page.locator('#login-error');
  
  // Wait for navigation away from index (Firebase auth may take a few seconds)
  // Increased timeout to 30s to handle environment latency
  try {
    await page.waitForURL(/dashboard\.html|retailer_portal\.html|sales_manager_portal\.html|batches\.html/, {
      timeout: 30000,
    });
  } catch (e) {
    // If we timeout, check if there's a visible error message on the page
    if (await errorEl.isVisible()) {
      const msg = await page.locator('#login-error-msg').innerText();
      throw new Error(`Login failed for ${email}: ${msg}`);
    }
    throw e;
  }
}


// ──────────────────────────────────────────────────────────────────────────────
// Test Suite
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Sprint 2: Inventory Aging & Retailer Collaboration (PB5–PB12)', () => {

  // ─── PB5: Dashboard Data Accuracy & Warehouse Filtering ───────────────────
  test('PB5: Dashboard Data Accuracy & Warehouse Filtering', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/dashboard.html');

    // Verify the main inventory table is visible (use unique ID to avoid strict-mode violation)
    await expect(page.locator('#dashboard-batch-tbody')).toBeVisible({ timeout: 10000 });

    // Verify column headers
    await expect(page.locator('th:has-text("Product")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Batch #")').first()).toBeVisible();

    // Test Warehouse filter
    const filter = page.locator('#table-warehouse-filter');
    await expect(filter).toBeVisible();
    await filter.selectOption('Kandy-03');

    // Table body should still render (even if empty for that warehouse)
    await expect(page.locator('#dashboard-batch-tbody')).toBeVisible();
  });

  // ─── PB6: Aging Bucket Classification & Highlighting ──────────────────────
  test('PB6: Aging Bucket Classification & Highlighting', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/dashboard.html');

    const bucketGrid = page.locator('#aging-buckets-grid');
    await expect(bucketGrid).toBeVisible({ timeout: 10000 });

    // Verify Critical Bucket card
    const criticalBucket = page.locator('.bucket-critical');
    await expect(criticalBucket).toBeVisible();
    await expect(criticalBucket.locator('.bucket-label')).toHaveText('Critical');
    await expect(criticalBucket.locator('.bucket-range-badge')).toHaveText('0 – 30 days');

    // Critical count must be styled in red
    const criticalCount = criticalBucket.locator('.bucket-count');
    await expect(criticalCount).toHaveCSS('color', 'rgb(220, 38, 38)');
  });

  // ─── PB7: Automated Shelf-Life Alerts ─────────────────────────────────────
  test('PB7: Automated Shelf-Life Alerts', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/dashboard.html');

    // Expand the critical panel
    await page.click('#critical-toggle-btn');
    const detailPanel = page.locator('#critical-detail-panel');
    await expect(detailPanel).toHaveClass(/expanded/, { timeout: 8000 });

    // The critical batches table body must exist
    await expect(page.locator('#critical-batch-tbody')).toBeVisible();
  });

  // ─── PB9: Retailer Portal Secure Access (RBAC) ────────────────────────────
  test('PB9: Retailer Portal Secure Access', async ({ page }) => {
    await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
    await page.goto('/retailer_portal.html');

    // Verify Retailer Portal landmarks
    await expect(page.locator('h1:has-text("Retailer Portal")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#nav-offers')).toBeVisible();
    await expect(page.locator('#nav-live')).toBeVisible();

    // RBAC: Retailer must be blocked from Sales Manager portal
    // The portal reads sessionStorage role before Firebase resolves,
    // so the in-page script redirects immediately.
    await page.goto('/sales_manager_portal.html');
    
    // Use a more flexible wait that accounts for the redirect to retailer_portal
    await page.waitForURL(url => {
      return url.pathname.includes('index.html') || url.pathname.includes('retailer_portal.html');
    }, { timeout: 15000 });
    
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/index\.html|retailer_portal\.html/);
  });

  // ─── PB10: Standardized Promotion Management ──────────────────────────────
  test('PB10: Standardized Promotion Management', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/sales_manager_portal.html');

    // Structural checks
    await expect(page.locator('text=Financial Review Queue')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Live Promotions Monitor')).toBeVisible();

    // Optional: Trigger a promotion if an escalated batch row exists
    const triggerBtn = page.locator('.btn-trigger').first();
    const hasTriggerBtn = await triggerBtn.isVisible();

    if (hasTriggerBtn) {
      const promoTitle = `AutoTest-${Date.now()}`;

      await triggerBtn.click();

      // Modal must open
      await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 5000 });

      // Fill in the promotion form
      await page.fill('#promo-title', promoTitle);
      await page.fill('#promo-discount', '25');
      await page.selectOption('#promo-retailer-id', { index: 1 });

      await page.click('#btn-submit-promo');

      // Modal must close after submission
      await expect(page.locator('#promo-modal-overlay')).not.toHaveClass(/open/, { timeout: 8000 });

      // The new promotion should appear in the Live Promotions Monitor
      const monitorTable = page.locator('#promotions-monitor-tbody');
      await expect(monitorTable.locator(`text=${promoTitle}`)).toBeVisible({ timeout: 8000 });

      // ── Search filter test ──────────────────────────────────────────────
      await page.fill('#promo-search', promoTitle);
      // After filtering, exactly 1 row matches
      await expect(monitorTable.locator('tr')).toHaveCount(1, { timeout: 5000 });

      // Searching for something that doesn't exist shows empty state
      await page.fill('#promo-search', 'ZZZ_NONEXISTENT_XYZ');
      await expect(page.locator('text=No matching promotions found.')).toBeVisible({ timeout: 5000 });

      // Clear the search
      await page.fill('#promo-search', '');

      // ── Status filter test ─────────────────────────────────────────────
      await page.selectOption('#promo-status-filter', 'active');
      await expect(monitorTable.locator(`text=${promoTitle}`)).toBeVisible({ timeout: 5000 });
    } else {
      // No escalated batches available – just confirm the monitor table structure
      await expect(page.locator('#promotions-monitor-tbody')).toBeVisible();
      await expect(page.locator('#promo-search')).toBeVisible();
      await expect(page.locator('#promo-status-filter')).toBeVisible();
    }
  });

  // ─── PB11: B2B Collaboration – Retailer Live Campaigns ────────────────────
  test('PB11: B2B Collaboration Velocity Tracking', async ({ page }) => {
    await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
    await page.goto('/retailer_portal.html');

    // Navigate to the Live Campaigns tab
    await page.click('#nav-live');

    // The tab itself must be visible (live-container may be 0-height if empty)
    await expect(page.locator('#tab-live')).toBeVisible({ timeout: 10000 });

    // Wait for Firebase data to load: either the empty-state OR a live card will appear.
    // Using auto-waiting locators avoids the race condition of an instant isVisible() check.
    const noLiveMsg = page.locator('#no-live-msg:visible');
    const liveCard = page.locator('#live-container .bg-white').first();

    await expect(noLiveMsg.or(liveCard)).toBeVisible({ timeout: 10000 });

    if (await noLiveMsg.isVisible()) {
      await expect(page.locator('text=No Live Campaigns')).toBeVisible();
    } else {
      // A live campaign card is visible — verify it contains the velocity structure.
      // The inner progress bar div may have width:0% (when soldUnits=0), making it
      // "hidden" per Playwright. Instead, assert the parent progress track exists
      // and the card contains the "Sales Velocity" label.
      await expect(liveCard).toContainText('Sales Velocity');
      await expect(liveCard.locator('.bg-gradient-to-r')).toHaveCount(1);
    }
  });

  // ─── PB12: End Campaign – Sales Manager terminates a live promotion ────────
  test('PB12: End Campaign – Sales Manager Can Terminate Promotions', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/sales_manager_portal.html');

    // Wait for Live Promotions Monitor to load
    await expect(page.locator('text=Live Promotions Monitor')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#promotions-monitor-tbody')).toBeVisible();

    // Check if there is at least one active/reserved campaign in the monitor
    const endBtn = page.locator('button:has-text("End Campaign")').first();
    const hasEndBtn = await endBtn.isVisible();

    if (hasEndBtn) {
      // Handle the browser confirm dialog
      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('end this campaign');
        await dialog.accept();
      });

      await endBtn.click();

      // After ending, a success toast should appear (or the row disappears)
      // We check either the toast or an empty-state message
      const toastOrEmpty = page.locator('#toast-container')
        .or(page.locator('text=No matching promotions found.'))
        .or(page.locator('text=No active promotions found.'));
      await expect(toastOrEmpty.first()).toBeVisible({ timeout: 8000 });
    } else {
      // No campaigns to end — verify the empty state is shown gracefully
      await expect(page.locator('#promotions-monitor-tbody')).toBeVisible();
      // Table either has the "no active promotions" message or campaigns
      const tbodyText = await page.locator('#promotions-monitor-tbody').innerText();
      // This is informational — won't fail the test
      console.log('No End Campaign buttons found. Monitor tbody content:', tbodyText.substring(0, 100));
    }
  });

  // ─── PB11-CustomQuantity: Retailer Can Accept Partial Quantity ────────────
  test('PB11-CustomQuantity: Retailer Can Accept Partial Quantity', async ({ page }) => {
    await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
    await page.goto('/retailer_portal.html');

    // Find the first offer card
    const offerCard = page.locator('#offers-container .bg-white').first();
    const hasOffer = await offerCard.isVisible({ timeout: 15000 });

    if (!hasOffer) {
      console.log('Skipping PB11-CustomQuantity test: No active offers found for retailer1');
      return;
    }

    // Capture the initial available quantity from the card
    // Note: The card has two .font-mono elements (Batch and Quantity). 
    // We want the one inside the grid (Quantity).
    const qtyText = await offerCard.locator('.font-mono').nth(1).innerText();
    const initialQty = parseInt(qtyText.replace(/,/g, ''));

    // Open the acceptance modal
    await offerCard.locator('button:has-text("Accept Offer")').click();
    await expect(page.locator('#accept-modal-overlay')).toHaveClass(/open/, { timeout: 5000 });

    // The quantity input should be visible and defaulted to max
    const qtyInput = page.locator('#claimed-quantity');
    await expect(qtyInput).toBeVisible();
    await expect(qtyInput).toHaveValue(initialQty.toString());

    // Enter a partial quantity (half of initial, at least 1)
    const claimedQty = Math.max(1, Math.floor(initialQty / 2));
    await qtyInput.fill(claimedQty.toString());

    // Submit the acceptance
    await page.click('#btn-submit-accept');

    // Modal must close
    await expect(page.locator('#accept-modal-overlay')).not.toHaveClass(/open/, { timeout: 8000 });

    // Navigate to Live Campaigns and verify the quantity
    await page.click('#nav-live');
    await expect(page.locator('#tab-live')).toBeVisible();

    // Verify the live campaign has the claimed quantity
    const liveCard = page.locator('#live-container .bg-white').first();
    await expect(liveCard).toBeVisible({ timeout: 10000 });
    await expect(liveCard).toContainText(`${claimedQty.toLocaleString()} total`);
  });

});
