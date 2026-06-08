# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint3.spec.js >> Sprint 3: Manual Test Cases (PB12 – PB15) >> TC-PB14-A [PB14]: Trigger Promo modal auto-fills promotion title and discount via velocity algorithm
- Location: tests\sprint3.spec.js:259:3

# Error details

```
Error: Login failed for planner@nestle.com: 
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e5]
      - generic [ref=e7]:
        - generic [ref=e8]: Nestlé · Sprint 1
        - generic [ref=e9]: Smart Stock Aging System
    - heading "Welcome back" [level=1] [ref=e10]
    - paragraph [ref=e11]: Sign in to access the warehouse management platform.
    - generic [ref=e12]:
      - generic [ref=e13] [cursor=pointer]: 🏢 Management Portal
      - generic [ref=e14] [cursor=pointer]: 📦 Warehouse Staff
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]: Email Address
        - textbox "you@nestle.com" [ref=e18]: planner@nestle.com
      - generic [ref=e19]:
        - generic [ref=e20]: Password
        - generic [ref=e21]:
          - textbox "••••••••" [ref=e22]: nestle123
          - button [ref=e23]:
            - img
      - img [ref=e27]
      - button "Sign In" [active] [ref=e29]: Sign In
    - generic [ref=e31]: Demo credentials — click to fill
    - generic [ref=e32]:
      - button "Supervisor supervisor@nestle.com" [ref=e33] [cursor=pointer]:
        - generic [ref=e34]: Supervisor
        - generic [ref=e35]: supervisor@nestle.com
      - button "Staff staff@nestle.com" [ref=e36] [cursor=pointer]:
        - generic [ref=e37]: Staff
        - generic [ref=e38]: staff@nestle.com
      - button "Demand Planner planner@nestle.com" [ref=e39] [cursor=pointer]:
        - generic [ref=e40]: Demand Planner
        - generic [ref=e41]: planner@nestle.com
      - button "Logistics Manager logistics@nestle.com" [ref=e42] [cursor=pointer]:
        - generic [ref=e43]: Logistics Manager
        - generic [ref=e44]: logistics@nestle.com
      - button "Sales Manager salesmanager@nestle.com" [ref=e45] [cursor=pointer]:
        - generic [ref=e46]: Sales Manager
        - generic [ref=e47]: salesmanager@nestle.com
      - button "Finance Auditor auditor@nestle.com" [ref=e48] [cursor=pointer]:
        - generic [ref=e49]: Finance Auditor
        - generic [ref=e50]: auditor@nestle.com
    - generic [ref=e51]: Retailer Access?
    - link "Submit a Stock Request → Retailer Access" [ref=e52] [cursor=pointer]:
      - /url: retailer.html
      - img [ref=e53]
      - text: Submit a Stock Request → Retailer Access
  - generic [ref=e55]:
    - img [ref=e57]
    - generic [ref=e59]:
      - heading "Login Successful" [level=3] [ref=e60]
      - paragraph [ref=e61]: Redirecting to your dashboard...
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | // ─────────────────────────────────────────────────────────────────────────────
  4   | // Helper: UI Login (mirrors the proven pattern from sprint2_automation.spec.js)
  5   | // ─────────────────────────────────────────────────────────────────────────────
  6   | async function uiLogin(page, email, password, role) {
  7   |   await page.goto('/index.html');
  8   | 
  9   |   if (role === 'Warehouse Staff') {
  10  |     await page.click('#tab-staff');
  11  |   } else {
  12  |     await page.click('#tab-supervisor');
  13  |   }
  14  | 
  15  |   await page.fill('#login-email', email);
  16  |   await page.fill('#login-password', password);
  17  |   await page.click('#login-btn');
  18  | 
  19  |   const errorEl = page.locator('#login-error');
  20  | 
  21  |   try {
  22  |     await page.waitForURL(
  23  |       /dashboard\.html|retailer_portal\.html|sales_manager_portal\.html|batches\.html/,
  24  |       { timeout: 30000 }
  25  |     );
  26  |   } catch (e) {
  27  |     if (await errorEl.isVisible()) {
  28  |       const msg = await page.locator('#login-error-msg').innerText();
> 29  |       throw new Error(`Login failed for ${email}: ${msg}`);
      |             ^ Error: Login failed for planner@nestle.com: 
  30  |     }
  31  |     throw e;
  32  |   }
  33  | }
  34  | 
  35  | // ─────────────────────────────────────────────────────────────────────────────
  36  | // Sprint 3 Test Suite: PB12 · PB13 · PB14 · PB15
  37  | // ─────────────────────────────────────────────────────────────────────────────
  38  | test.describe('Sprint 3: Manual Test Cases (PB12 – PB15)', () => {
  39  |   test.setTimeout(90000); // Account for Firebase login and data fetching delays
  40  | 
  41  | 
  42  |   // ─── TC-01: PB12 – Intelligent Retailer Dropdown ──────────────────────────
  43  |   test('TC-01 [PB12]: Retailer dropdown shows "Recommended (Top Performers)" group', async ({ page }) => {
  44  |     await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
  45  |     await page.goto('/sales_manager_portal.html');
  46  | 
  47  |     // Wait for the page to fully render
  48  |     await expect(page.locator('text=Live Promotions Monitor')).toBeVisible({ timeout: 15000 });
  49  | 
  50  |     // Find a "Trigger Promotion" button if any escalated batch exists
  51  |     const triggerBtn = page.locator('.btn-trigger').first();
  52  |     const hasTriggerBtn = await triggerBtn.isVisible();
  53  | 
  54  |     if (hasTriggerBtn) {
  55  |       await triggerBtn.click();
  56  |       await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 8000 });
  57  | 
  58  |       // The retailer select must have a "Recommended" optgroup if PB12 is active
  59  |       const optgroups = page.locator('#promo-retailer optgroup');
  60  |       if (await optgroups.count() > 0) {
  61  |         const firstLabel = await optgroups.first().getAttribute('label');
  62  |         expect(firstLabel).toMatch(/Recommended|Top Performer/i);
  63  |         console.log(`✅ TC-01 PASS: Retailer dropdown has optgroup: "${firstLabel}"`);
  64  |       } else {
  65  |         // Fallback: plain select still exists — structural check passes
  66  |         await expect(page.locator('#promo-retailer')).toBeVisible();
  67  |         console.log('ℹ️ TC-01 INFO: No optgroups found — plain retailer select is present.');
  68  |       }
  69  |     } else {
  70  |       // No batches to trigger — verify the modal structure exists
  71  |       await expect(page.locator('#promotions-monitor-tbody')).toBeVisible();
  72  |       console.log('ℹ️ TC-01 SKIP: No escalated batches available to trigger promotion.');
  73  |     }
  74  |   });
  75  | 
  76  |   // ─── TC-02: PB13 – Financial ROI Visualization ────────────────────────────
  77  |   test('TC-02 [PB13]: Financial ROI dashboard renders Rescued vs. Expired volumes', async ({ page }) => {
  78  |     test.slow(); // Increases default timeout by 3x (e.g. 30s -> 90s) to account for login delay and Firestore fetching
  79  | 
  80  |     await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
  81  | 
  82  |     // Navigate directly to the ROI dashboard
  83  |     await page.goto('/financial_roi.html');
  84  | 
  85  |     // Confirm the page loads with a heading
  86  |     const heading = page.locator('h1, h2').filter({ hasText: /ROI|Financial|Product Rescue/i }).first();
  87  |     await expect(heading).toBeVisible({ timeout: 15000 });
  88  | 
  89  |     // Check for summary metric cards (Rescued / Expired)
  90  |     const rescuedEl = page.locator('#card-rescued, [id*="rescued"]').first();
  91  |     const expiredEl = page.locator('#card-lost, [id*="lost"]').first();
  92  |     await expect(rescuedEl).toBeVisible({ timeout: 10000 });
  93  |     await expect(expiredEl).toBeVisible({ timeout: 10000 });
  94  | 
  95  |     // Check for the ROI bar chart canvas becoming visible
  96  |     const chart = page.locator('#roi-chart').first();
  97  |     await expect(chart).toBeVisible({ timeout: 15000 });
  98  | 
  99  |     console.log('✅ TC-02 PASS: ROI dashboard rendered with Rescued/Expired metrics and chart.');
  100 |   });
  101 | 
  102 |   // ─── TC-03: PB14 – Predictive Velocity Warnings ───────────────────────────
  103 |   test('TC-03 [PB14]: Dashboard displays Early Warnings section for at-risk batches', async ({ page }) => {
  104 |     await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
  105 |     await page.goto('/dashboard.html');
  106 | 
  107 |     // Dashboard must load the main batch table
  108 |     await expect(page.locator('#dashboard-batch-tbody')).toBeVisible({ timeout: 15000 });
  109 | 
  110 |     // Check for Early Warnings or Critical section
  111 |     const warningsSection = page.locator(
  112 |       '#early-warnings, .early-warnings, h3:has-text("Early Warning"), .bucket-critical'
  113 |     ).first();
  114 | 
  115 |     const isVisible = await warningsSection.isVisible();
  116 |     if (isVisible) {
  117 |       await expect(warningsSection).toBeVisible();
  118 |       console.log('✅ TC-03 PASS: Early Warnings / Critical section is visible.');
  119 |     } else {
  120 |       // The aging bucket grid must at minimum be present
  121 |       await expect(page.locator('#aging-buckets-grid')).toBeVisible({ timeout: 10000 });
  122 |       console.log('ℹ️ TC-03 INFO: No "Early Warnings" label found; aging bucket grid is visible.');
  123 |     }
  124 |   });
  125 | 
  126 |   // ─── TC-04: PB15 – Smart Feed Sorting ────────────────────────────────────
  127 |   test('TC-04 [PB15]: Smart Procurement Feed renders and shows personalized header', async ({ page }) => {
  128 |     await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
  129 |     await page.goto('/retailer_portal.html');
```