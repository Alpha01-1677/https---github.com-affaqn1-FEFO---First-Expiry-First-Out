# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint2-dashboard.spec.js >> Sprint 2: Manual Test Cases - Dashboard & Features (PB5-PB8) >> Regional/Warehouse Risk View (PB8)
- Location: tests\sprint2-dashboard.spec.js:134:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard\.html/
Received string:  "http://127.0.0.1:8080/index.html"
Timeout: 20000ms

Call log:
  - Expect "toHaveURL" with timeout 20000ms
    43 × unexpected value "http://127.0.0.1:8080/index.html"

```

```yaml
- img
- text: Nestlé · Sprint 1 Smart Stock Aging System
- heading "Welcome back" [level=1]
- paragraph: Sign in to access the warehouse management platform.
- text: 🏢 Management Portal 📦 Warehouse Staff Email Address
- textbox "you@nestle.com": planner@nestle.com
- text: Password
- textbox "••••••••": nestle123
- button:
  - img
- img
- button "Sign In"
- text: Demo credentials — click to fill
- button "Supervisor supervisor@nestle.com"
- button "Staff staff@nestle.com"
- button "Demand Planner planner@nestle.com"
- button "Logistics Manager logistics@nestle.com"
- button "Sales Manager salesmanager@nestle.com"
- button "Finance Auditor auditor@nestle.com"
- text: Retailer Access?
- link "Submit a Stock Request → Retailer Access":
  - /url: retailer.html
  - img
  - text: Submit a Stock Request → Retailer Access
- img
- heading "Login Successful" [level=3]
- paragraph: Redirecting to your dashboard...
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | test.describe('Sprint 2: Manual Test Cases - Dashboard & Features (PB5-PB8)', () => {
  4   | 
  5   |     test.beforeEach(async ({ page }) => {
  6   |         await test.step('Log in as Demand Planner and Navigate to Dashboard', async () => {
  7   |             await page.goto('http://127.0.0.1:8080/index.html');
  8   | 
  9   |             // Ensure Management Portal tab is explicitly active
  10  |             await page.click('#tab-supervisor');
  11  | 
  12  |             // Fill credentials directly to bypass buggy UI demo helpers
  13  |             await page.fill('#login-email', 'planner@nestle.com');
  14  |             await page.fill('#login-password', 'nestle123');
  15  | 
  16  |             await page.click('#login-btn');
  17  | 
  18  |             // Wait for redirect to dashboard using a web-first assertion (increased timeout for parallel overhead)
> 19  |             await expect(page).toHaveURL(/.*dashboard\.html/, { timeout: 20000 });
      |                                ^ Error: expect(page).toHaveURL(expected) failed
  20  |         });
  21  |     });
  22  | 
  23  |     test('Dashboard Data Accuracy (PB5)', async ({ page }) => {
  24  |         await test.step('Step 1: Log in as a Demand Planner', async () => {
  25  |             // Covered in beforeEach, verify we are on dashboard
  26  |             expect(page.url()).toContain('dashboard.html');
  27  |         });
  28  | 
  29  |         await test.step('Step 2: Navigate to the Inventory Aging Dashboard', async () => {
  30  |             // Verify dashboard elements are visible
  31  |             await expect(page.locator('#stat-total-batches')).toBeVisible();
  32  |         });
  33  | 
  34  |         await test.step('Expected Result: Dashboard displays SKU, Batch, Expiry Date, Quantity, and Value at Risk correctly', async () => {
  35  |             // Check headers explicitly in the FEFO Batch Queue table (which contains 'Shelf Life %')
  36  |             const fefoTable = page.locator('table').filter({ hasText: 'Shelf Life %' });
  37  |             const tableHeaders = fefoTable.locator('th');
  38  | 
  39  |             await expect(tableHeaders.nth(0)).toContainText('Batch #');
  40  |             await expect(tableHeaders.nth(1)).toContainText('Product');
  41  |             await expect(tableHeaders.nth(2)).toContainText('Expiry');
  42  |             await expect(tableHeaders.nth(3)).toContainText('Qty');
  43  |             await expect(tableHeaders.nth(4)).toContainText('Shelf Life %');
  44  |             await expect(tableHeaders.nth(5)).toContainText('Status');
  45  |         });
  46  |     });
  47  | 
  48  |     test('Warehouse Filtering (PB5)', async ({ page }) => {
  49  |         await test.step('Step 1: Open Dashboard', async () => {
  50  |             await expect(page.locator('#table-warehouse-filter')).toBeVisible();
  51  |         });
  52  | 
  53  |         await test.step('Step 2: Select a specific warehouse from the filter dropdown', async () => {
  54  |             await page.selectOption('#table-warehouse-filter', 'Colombo-01');
  55  |         });
  56  | 
  57  |         await test.step('Expected Result: The data updates to show only stock relevant to the selected warehouse', async () => {
  58  |             // Verify table updates (we assume dashboard-batch-tbody finishes loading)
  59  |             await expect(page.locator('#dashboard-batch-tbody')).toBeVisible();
  60  |         });
  61  |     });
  62  | 
  63  |     test('Automatic Aging Bucket Classification (PB6)', async ({ page }) => {
  64  |         await test.step('Step 1: View Aging Bucket panel', async () => {
  65  |             await expect(page.locator('#aging-buckets-grid')).toBeVisible();
  66  |         });
  67  | 
  68  |         await test.step('Step 2: Compare batch expiry dates with their assigned buckets', async () => {
  69  |             // Verify buckets exist
  70  |             await expect(page.locator('.bucket-critical')).toContainText('0 – 30 days');
  71  |             await expect(page.locator('.bucket-warning')).toContainText('31 – 60 days');
  72  |             await expect(page.locator('.bucket-stable')).toContainText('60+ days');
  73  |         });
  74  | 
  75  |         await test.step('Expected Result: Stock is automatically and correctly grouped into the specified buckets', async () => {
  76  |             await expect(page.locator('#bucket-critical-count')).toBeVisible();
  77  |             await expect(page.locator('#bucket-warning-count')).toBeVisible();
  78  |             await expect(page.locator('#bucket-stable-count')).toBeVisible();
  79  |         });
  80  |     });
  81  | 
  82  |     test('Near-Expiry Highlighting (PB6)', async ({ page }) => {
  83  |         await test.step('Step 1: Inspect the 0-30 day aging bucket', async () => {
  84  |             await expect(page.locator('.bucket-critical')).toBeVisible();
  85  |         });
  86  | 
  87  |         await test.step('Step 2: Look for visual cues (e.g., red text or icons)', async () => {
  88  |             const criticalTitle = page.locator('.bucket-critical .bucket-label');
  89  |             await expect(criticalTitle).toContainText('Critical');
  90  |         });
  91  | 
  92  |         await test.step('Expected Result: Items with < 30 days remaining are visually distinguished for urgent attention', async () => {
  93  |             // Red text logic check
  94  |             const criticalCount = page.locator('.bucket-critical .bucket-count');
  95  |             await expect(criticalCount).toHaveCSS('color', 'rgb(220, 38, 38)'); // #dc2626
  96  |         });
  97  |     });
  98  | 
  99  |     test('Automated Shelf-Life Alerts (PB7)', async ({ page }) => {
  100 |         await test.step('Step 1: Set a shelf-life threshold for a product / check active alerts', async () => {
  101 |             // In the dashboard, alerts can be viewed by expanding the critical panel
  102 |             await page.click('#critical-toggle-btn');
  103 |         });
  104 | 
  105 |         await test.step('Step 2: Advance system time or check a batch that passes threshold', async () => {
  106 |             await expect(page.locator('#critical-detail-panel')).toHaveClass(/expanded/);
  107 |         });
  108 | 
  109 |         await test.step('Expected Result: System sends/displays an alert with SKU, Batch, Days Remaining, and Warning', async () => {
  110 |             // The panel shows critical batches
  111 |             const criticalTable = page.locator('#critical-batch-tbody');
  112 |             await expect(criticalTable).toBeVisible();
  113 |         });
  114 |     });
  115 | 
  116 |     test('Actioning Alerts (PB7)', async ({ page }) => {
  117 |         await test.step('Step 1: Identify an active expiry alert', async () => {
  118 |             // Expand panel
  119 |             await page.click('#critical-toggle-btn');
```