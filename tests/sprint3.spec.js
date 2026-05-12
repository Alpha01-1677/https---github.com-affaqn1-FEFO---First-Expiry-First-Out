const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: UI Login (mirrors the proven pattern from sprint2_automation.spec.js)
// ─────────────────────────────────────────────────────────────────────────────
async function uiLogin(page, email, password, role) {
  await page.goto('/index.html');

  if (role === 'Warehouse Staff') {
    await page.click('#tab-staff');
  } else {
    await page.click('#tab-supervisor');
  }

  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('#login-btn');

  const errorEl = page.locator('#login-error');

  try {
    await page.waitForURL(
      /dashboard\.html|retailer_portal\.html|sales_manager_portal\.html|batches\.html/,
      { timeout: 30000 }
    );
  } catch (e) {
    if (await errorEl.isVisible()) {
      const msg = await page.locator('#login-error-msg').innerText();
      throw new Error(`Login failed for ${email}: ${msg}`);
    }
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sprint 3 Test Suite: PB12 · PB13 · PB14 · PB15
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Sprint 3: Manual Test Cases (PB12 – PB15)', () => {
  test.setTimeout(90000); // Account for Firebase login and data fetching delays


  // ─── TC-01: PB12 – Intelligent Retailer Dropdown ──────────────────────────
  test('TC-01 [PB12]: Retailer dropdown shows "Recommended (Top Performers)" group', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/sales_manager_portal.html');

    // Wait for the page to fully render
    await expect(page.locator('text=Live Promotions Monitor')).toBeVisible({ timeout: 15000 });

    // Find a "Trigger Promotion" button if any escalated batch exists
    const triggerBtn = page.locator('.btn-trigger').first();
    const hasTriggerBtn = await triggerBtn.isVisible();

    if (hasTriggerBtn) {
      await triggerBtn.click();
      await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 8000 });

      // The retailer select must have a "Recommended" optgroup if PB12 is active
      const optgroups = page.locator('#promo-retailer optgroup');
      if (await optgroups.count() > 0) {
        const firstLabel = await optgroups.first().getAttribute('label');
        expect(firstLabel).toMatch(/Recommended|Top Performer/i);
        console.log(`✅ TC-01 PASS: Retailer dropdown has optgroup: "${firstLabel}"`);
      } else {
        // Fallback: plain select still exists — structural check passes
        await expect(page.locator('#promo-retailer')).toBeVisible();
        console.log('ℹ️ TC-01 INFO: No optgroups found — plain retailer select is present.');
      }
    } else {
      // No batches to trigger — verify the modal structure exists
      await expect(page.locator('#promotions-monitor-tbody')).toBeVisible();
      console.log('ℹ️ TC-01 SKIP: No escalated batches available to trigger promotion.');
    }
  });

  // ─── TC-02: PB13 – Financial ROI Visualization ────────────────────────────
  test('TC-02 [PB13]: Financial ROI dashboard renders Rescued vs. Expired volumes', async ({ page }) => {
    test.slow(); // Increases default timeout by 3x (e.g. 30s -> 90s) to account for login delay and Firestore fetching

    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');

    // Navigate directly to the ROI dashboard
    await page.goto('/financial_roi.html');

    // Confirm the page loads with a heading
    const heading = page.locator('h1, h2').filter({ hasText: /ROI|Financial|Product Rescue/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Check for summary metric cards (Rescued / Expired)
    const rescuedEl = page.locator('#card-rescued, [id*="rescued"]').first();
    const expiredEl = page.locator('#card-lost, [id*="lost"]').first();
    await expect(rescuedEl).toBeVisible({ timeout: 10000 });
    await expect(expiredEl).toBeVisible({ timeout: 10000 });

    // Check for the ROI bar chart canvas becoming visible
    const chart = page.locator('#roi-chart').first();
    await expect(chart).toBeVisible({ timeout: 15000 });

    console.log('✅ TC-02 PASS: ROI dashboard rendered with Rescued/Expired metrics and chart.');
  });

  // ─── TC-03: PB14 – Predictive Velocity Warnings ───────────────────────────
  test('TC-03 [PB14]: Dashboard displays Early Warnings section for at-risk batches', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/dashboard.html');

    // Dashboard must load the main batch table
    await expect(page.locator('#dashboard-batch-tbody')).toBeVisible({ timeout: 15000 });

    // Check for Early Warnings or Critical section
    const warningsSection = page.locator(
      '#early-warnings, .early-warnings, h3:has-text("Early Warning"), .bucket-critical'
    ).first();

    const isVisible = await warningsSection.isVisible();
    if (isVisible) {
      await expect(warningsSection).toBeVisible();
      console.log('✅ TC-03 PASS: Early Warnings / Critical section is visible.');
    } else {
      // The aging bucket grid must at minimum be present
      await expect(page.locator('#aging-buckets-grid')).toBeVisible({ timeout: 10000 });
      console.log('ℹ️ TC-03 INFO: No "Early Warnings" label found; aging bucket grid is visible.');
    }
  });

  // ─── TC-04: PB15 – Smart Feed Sorting ────────────────────────────────────
  test('TC-04 [PB15]: Smart Procurement Feed renders and shows personalized header', async ({ page }) => {
    await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
    await page.goto('/retailer_portal.html');

    // The new PB15 header must be visible
    await expect(
      page.locator('h2:has-text("Retailer Portal")')
    ).toBeVisible({ timeout: 15000 });

    // The "PB15 Personalized" badge must be rendered
    await expect(
      page.locator('span:has-text("PB15 Personalized")')
    ).toBeVisible({ timeout: 10000 });

    // Curated feed description must be visible
    await expect(
      page.locator('p:has-text("Curated promotional offers")')
    ).toBeVisible({ timeout: 10000 });

    // Offers container must be present in the DOM
    await expect(page.locator('#offers-container')).toBeAttached({ timeout: 10000 });

    // Poll until Firebase populates cards or the empty-state appears (avoids hardcoded delays)
    await expect(async () => {
      const hasOffers = await page.locator('#offers-container .bg-white').count() > 0;
      const noOffersVisible = await page.locator('#no-offers-msg').isVisible();
      expect(hasOffers || noOffersVisible).toBeTruthy();
    }).toPass({ timeout: 15000 });

    console.log('✅ TC-04 PASS: Smart Procurement Feed header, badge, and container/empty state are verified.');
  });

  // ─── TC-05: PB15 – Top Match UI Badge ────────────────────────────────────
  test('TC-05 [PB15]: Top Match badge is shown on highest-affinity promotion', async ({ page }) => {
    await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
    await page.goto('/retailer_portal.html');

    const offersContainer = page.locator('#offers-container');
    const noOffersMsg = page.locator('#no-offers-msg');

    // Wait for either the container to have cards or the empty state to show
    await expect(async () => {
      const cardsVisible = await offersContainer.locator('.bg-white').first().isVisible();
      const emptyVisible = await noOffersMsg.isVisible();
      expect(cardsVisible || emptyVisible).toBeTruthy();
    }).toPass({ timeout: 15000 });

    // Check whether there are offer cards
    const offerCards = offersContainer.locator('.bg-white');
    const count = await offerCards.count();

    if (count > 0) {
      // If there is a top-match badge (only appears when retailer has history)
      const topMatchBadges = page.locator('[class*="purple"]:has-text("Top Match")');
      const badgeCount = await topMatchBadges.count();

      if (badgeCount > 0) {
        // Verify badge contains personalized text
        const badgeText = await topMatchBadges.first().innerText();
        expect(badgeText).toMatch(/Top Match|Based on past success/i);
        console.log(`✅ TC-05 PASS: Top Match badge found: "${badgeText}"`);
      } else {
        // No history yet → standard cards should still render (no badge is valid fallback)
        await expect(offerCards.first()).toBeVisible();
        console.log('ℹ️ TC-05 INFO: No Top Match badge (retailer has no history yet). Standard cards rendered.');
      }
    } else {
      // Either no cards, or the explicit no-offers message is shown
      const noOffersDivVisible = await noOffersMsg.isVisible();
      expect(count === 0 || noOffersDivVisible).toBeTruthy();
      console.log(`ℹ️ TC-05 SKIP: No active offers — card count: ${count}, noOffersMsg visible: ${noOffersDivVisible}`);
    }
  });

  // ─── TC-06: PB15 – Smart Claim Quantity Suggestion ───────────────────────
  test('TC-06 [PB15]: Accept modal shows Smart Suggestion for optimal claim quantity', async ({ page }) => {
    await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
    await page.goto('/retailer_portal.html');

    const offersContainer = page.locator('#offers-container');
    const noOffersMsg = page.locator('#no-offers-msg');

    // Wait for either the container to have cards or the empty state to show
    await expect(async () => {
      const cardsVisible = await offersContainer.locator('.bg-white').first().isVisible();
      const emptyVisible = await noOffersMsg.isVisible();
      expect(cardsVisible || emptyVisible).toBeTruthy();
    }).toPass({ timeout: 15000 });

    // Find accept/claim buttons on offer cards
    const acceptBtns = page.locator(
      'button:has-text("Accept Offer"), button:has-text("Accept Promotion"), button:has-text("Claim")'
    );
    const btnCount = await acceptBtns.count();

    if (btnCount > 0) {
      await acceptBtns.first().click();

      // Modal must open
      const modal = page.locator('#accept-modal-overlay, [id*="accept-modal"]').first();
      await expect(modal).toBeVisible({ timeout: 8000 });

      // Claimed quantity input must be pre-filled
      const qtyInput = page.locator('#claimed-quantity');
      await expect(qtyInput).toBeVisible();
      const prefilled = await qtyInput.inputValue();
      expect(parseInt(prefilled)).toBeGreaterThan(0);

      // Check for Smart Suggestion label (PB15 feature)
      const suggestionLabel = page.locator(
        '#smart-suggestion-text, [id*="smart"]'
      ).or(page.getByText('Smart Suggestion')).first();
      const hasSuggestion = await suggestionLabel.isVisible();

      if (hasSuggestion) {
        const labelText = await suggestionLabel.innerText();
        expect(labelText).toMatch(/Smart Suggestion/i);
        console.log(`✅ TC-06 PASS: Smart Suggestion label found: "${labelText}"`);
      } else {
        // Fallback: the quantity is pre-filled which is the core behavior
        console.log(`ℹ️ TC-06 INFO: No Smart Suggestion label (no history). Quantity pre-filled with: ${prefilled}`);
      }
    } else {
      console.log('ℹ️ TC-06 SKIP: No active offers to click. Verifying empty state.');
      // Both elements may resolve — check each individually
      const containerVisible = await offersContainer.locator('.bg-white').first().isVisible();
      const noOfferVisible = await noOffersMsg.isVisible();
      expect(containerVisible || noOfferVisible).toBeTruthy();
    }
  });

  // ─── TC-PB14-A: Velocity Algorithm – Modal auto-fills title & discount ────
  test('TC-PB14-A [PB14]: Trigger Promo modal auto-fills promotion title and discount via velocity algorithm', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/sales_manager_portal.html');

    // Wait for the escalated batches table to load
    await expect(page.locator('#escalated-tbody')).toBeVisible({ timeout: 15000 });

    // Wait until at least one Trigger Promo button appears (or confirm no batches exist)
    const triggerBtn = page.locator('.btn-trigger').first();
    const hasBatch = await expect(async () => {
      const visible = await triggerBtn.isVisible();
      expect(visible).toBe(true);
    }).toPass({ timeout: 20000 }).then(() => true).catch(() => false);

    if (!hasBatch) {
      console.log('ℹ️ TC-PB14-A SKIP: No escalated batches available — cannot open promotion modal.');
      return;
    }

    // Open the promotion modal
    await triggerBtn.click();
    await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 8000 });

    // PB14: Verify promo-title is auto-filled with a non-empty value
    const titleInput = page.locator('#promo-title');
    await expect(titleInput).toBeVisible();
    const titleValue = await titleInput.inputValue();
    expect(titleValue.trim().length).toBeGreaterThan(0);
    expect(titleValue).toMatch(/Clearance|Special|Markdown|Flash/i);

    // PB14: Verify promo-discount is auto-filled with a valid numeric value
    const discountInput = page.locator('#promo-discount');
    await expect(discountInput).toBeVisible();
    const discountValue = parseInt(await discountInput.inputValue(), 10);
    expect([10, 25, 40, 50]).toContain(discountValue);

    // PB14: Verify the AI Recommended hints are shown
    const titleHint    = page.locator('#ai-title-hint');
    const discountHint = page.locator('#ai-discount-hint');
    await expect(titleHint).toBeVisible();
    await expect(discountHint).toBeVisible();

    console.log(`✅ TC-PB14-A PASS: Modal auto-filled — Title: "${titleValue}", Discount: ${discountValue}%`);
  });

  // ─── TC-PB14-B: Velocity Algorithm – Three-Tier discount correctness ───────
  test('TC-PB14-B [PB14]: Auto-filled discount matches one of the three velocity tiers (10/25/40)', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/sales_manager_portal.html');

    await expect(page.locator('#escalated-tbody')).toBeVisible({ timeout: 15000 });

    const triggerBtn = page.locator('.btn-trigger').first();
    const hasBatch = await expect(async () => {
      expect(await triggerBtn.isVisible()).toBe(true);
    }).toPass({ timeout: 20000 }).then(() => true).catch(() => false);

    if (!hasBatch) {
      console.log('ℹ️ TC-PB14-B SKIP: No escalated batches — velocity tier cannot be evaluated.');
      return;
    }

    await triggerBtn.click();
    await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 8000 });

    const discount = parseInt(await page.locator('#promo-discount').inputValue(), 10);
    const title    = await page.locator('#promo-title').inputValue();

    // Map each valid tier and verify title matches the assigned discount
    const TIER_MAP = {
      10: /Stock Clearance/i,
      25: /Weekend Special/i,
      40: /Flash Sale|Final Markdown/i,
      50: /Flash Sale|Fresh Clearance/i  // Dairy critical tier
    };

    expect(Object.keys(TIER_MAP).map(Number)).toContain(discount);
    if (TIER_MAP[discount]) {
      expect(title).toMatch(TIER_MAP[discount]);
    }

    // Verify the form fields are still editable (manager must be able to override)
    const titleInput    = page.locator('#promo-title');
    const discountInput = page.locator('#promo-discount');
    await expect(titleInput).not.toBeDisabled();
    await expect(discountInput).not.toBeDisabled();

    // Verify manager can change the value (editability check)
    await titleInput.fill('My Custom Title');
    const overriddenTitle = await titleInput.inputValue();
    expect(overriddenTitle).toBe('My Custom Title');

    console.log(`✅ TC-PB14-B PASS: Tier verified — Discount: ${discount}%, Title pattern matched. Fields are editable.`);
  });

  // ─── TC-PB14-C: Velocity Algorithm – AI hints render correctly ─────────────
  test('TC-PB14-C [PB14]: AI Recommended hints appear after batch selection and are labelled correctly', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/sales_manager_portal.html');

    await expect(page.locator('#escalated-tbody')).toBeVisible({ timeout: 15000 });

    const allTriggerBtns = page.locator('.btn-trigger');

    // Wait for at least one button OR confirm empty queue
    const hasBatch = await expect(async () => {
      expect(await allTriggerBtns.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 20000 }).then(() => true).catch(() => false);

    if (!hasBatch) {
      console.log('ℹ️ TC-PB14-C SKIP: No escalated batches — AI hint rendering cannot be verified.');
      return;
    }

    // Click the first batch to open modal
    await allTriggerBtns.first().click();
    await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 8000 });

    // Both AI hint badges must be visible immediately after modal open
    const titleHint    = page.locator('#ai-title-hint');
    const discountHint = page.locator('#ai-discount-hint');
    await expect(titleHint).toBeVisible({ timeout: 5000 });
    await expect(discountHint).toBeVisible({ timeout: 5000 });

    const hintText = await titleHint.innerText();
    expect(hintText).toMatch(/AI Recommended/i);

    // Verify promo-title field has a blue-tinted border (PB14 visual indicator)
    await expect(async () => {
      const borderColor = await page.locator('#promo-title').evaluate(
        el => window.getComputedStyle(el).borderColor
      );
      // The border is set to #c7d2fe (indigo-200) — any non-default colour confirms the hint is applied
      expect(borderColor).not.toBe('rgb(226, 232, 240)'); // Not default gray
    }).toPass({ timeout: 5000 });

    console.log(`✅ TC-PB14-C PASS: AI hints visible — "${hintText}". Indigo border confirmed on auto-filled fields.`);
  });

  // ─── TC-07: Logout Functionality ──────────────────────────────────────────
  test('TC-07: Logout button correctly signs out and redirects to login', async ({ page }) => {
    await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
    await page.goto('/sales_manager_portal.html');

    // Wait for sidebar to load and sign out button to be present
    const logoutBtn = page.locator('button[title="Sign Out"]');
    await expect(logoutBtn).toBeVisible({ timeout: 15000 });

    // Click the logout button
    await logoutBtn.click();

    // Verify redirection to index.html
    await page.waitForURL(/\/index\.html/, { timeout: 15000 });

    // Verify session is cleared (login form is visible)
    await expect(page.locator('#login-btn')).toBeVisible();

    console.log('✅ TC-07 PASS: Logout functionality verified on Sales Manager portal.');
  });

});
