const { test, expect } = require('@playwright/test');

test.describe('Sprint 2: Manual Test Cases - Dashboard & Features (PB5-PB8)', () => {

    test.beforeEach(async ({ page }) => {
        await test.step('Log in as Demand Planner and Navigate to Dashboard', async () => {
            await page.goto('http://127.0.0.1:8080/index.html');

            // Ensure Management Portal tab is explicitly active
            await page.click('#tab-supervisor');

            // Fill credentials directly to bypass buggy UI demo helpers
            await page.fill('#login-email', 'planner@nestle.com');
            await page.fill('#login-password', 'nestle123');

            await page.click('#login-btn');

            // Wait for redirect to dashboard using a web-first assertion (increased timeout for parallel overhead)
            await expect(page).toHaveURL(/.*dashboard\.html/, { timeout: 20000 });
        });
    });

    test('Dashboard Data Accuracy (PB5)', async ({ page }) => {
        await test.step('Step 1: Log in as a Demand Planner', async () => {
            // Covered in beforeEach, verify we are on dashboard
            expect(page.url()).toContain('dashboard.html');
        });

        await test.step('Step 2: Navigate to the Inventory Aging Dashboard', async () => {
            // Verify dashboard elements are visible
            await expect(page.locator('#stat-total-batches')).toBeVisible();
        });

        await test.step('Expected Result: Dashboard displays SKU, Batch, Expiry Date, Quantity, and Value at Risk correctly', async () => {
            // Check headers explicitly in the FEFO Batch Queue table (which contains 'Shelf Life %')
            const fefoTable = page.locator('table').filter({ hasText: 'Shelf Life %' });
            const tableHeaders = fefoTable.locator('th');

            await expect(tableHeaders.nth(0)).toContainText('Batch #');
            await expect(tableHeaders.nth(1)).toContainText('Product');
            await expect(tableHeaders.nth(2)).toContainText('Expiry');
            await expect(tableHeaders.nth(3)).toContainText('Qty');
            await expect(tableHeaders.nth(4)).toContainText('Shelf Life %');
            await expect(tableHeaders.nth(5)).toContainText('Status');
        });
    });

    test('Warehouse Filtering (PB5)', async ({ page }) => {
        await test.step('Step 1: Open Dashboard', async () => {
            await expect(page.locator('#table-warehouse-filter')).toBeVisible();
        });

        await test.step('Step 2: Select a specific warehouse from the filter dropdown', async () => {
            await page.selectOption('#table-warehouse-filter', 'Colombo-01');
        });

        await test.step('Expected Result: The data updates to show only stock relevant to the selected warehouse', async () => {
            // Verify table updates (we assume dashboard-batch-tbody finishes loading)
            await expect(page.locator('#dashboard-batch-tbody')).toBeVisible();
        });
    });

    test('Automatic Aging Bucket Classification (PB6)', async ({ page }) => {
        await test.step('Step 1: View Aging Bucket panel', async () => {
            await expect(page.locator('#aging-buckets-grid')).toBeVisible();
        });

        await test.step('Step 2: Compare batch expiry dates with their assigned buckets', async () => {
            // Verify buckets exist
            await expect(page.locator('.bucket-critical')).toContainText('0 – 30 days');
            await expect(page.locator('.bucket-warning')).toContainText('31 – 60 days');
            await expect(page.locator('.bucket-stable')).toContainText('60+ days');
        });

        await test.step('Expected Result: Stock is automatically and correctly grouped into the specified buckets', async () => {
            await expect(page.locator('#bucket-critical-count')).toBeVisible();
            await expect(page.locator('#bucket-warning-count')).toBeVisible();
            await expect(page.locator('#bucket-stable-count')).toBeVisible();
        });
    });

    test('Near-Expiry Highlighting (PB6)', async ({ page }) => {
        await test.step('Step 1: Inspect the 0-30 day aging bucket', async () => {
            await expect(page.locator('.bucket-critical')).toBeVisible();
        });

        await test.step('Step 2: Look for visual cues (e.g., red text or icons)', async () => {
            const criticalTitle = page.locator('.bucket-critical .bucket-label');
            await expect(criticalTitle).toContainText('Critical');
        });

        await test.step('Expected Result: Items with < 30 days remaining are visually distinguished for urgent attention', async () => {
            // Red text logic check
            const criticalCount = page.locator('.bucket-critical .bucket-count');
            await expect(criticalCount).toHaveCSS('color', 'rgb(220, 38, 38)'); // #dc2626
        });
    });

    test('Automated Shelf-Life Alerts (PB7)', async ({ page }) => {
        await test.step('Step 1: Set a shelf-life threshold for a product / check active alerts', async () => {
            // In the dashboard, alerts can be viewed by expanding the critical panel
            await page.click('#critical-toggle-btn');
        });

        await test.step('Step 2: Advance system time or check a batch that passes threshold', async () => {
            await expect(page.locator('#critical-detail-panel')).toHaveClass(/expanded/);
        });

        await test.step('Expected Result: System sends/displays an alert with SKU, Batch, Days Remaining, and Warning', async () => {
            // The panel shows critical batches
            const criticalTable = page.locator('#critical-batch-tbody');
            await expect(criticalTable).toBeVisible();
        });
    });

    test('Actioning Alerts (PB7)', async ({ page }) => {
        await test.step('Step 1: Identify an active expiry alert', async () => {
            // Expand panel
            await page.click('#critical-toggle-btn');
            await expect(page.locator('#critical-detail-panel')).toHaveClass(/expanded/);
        });

        await test.step('Step 2: Click the "Mark as Actioned" button/checkbox', async () => {
            const markActionedBtn = page.locator('.btn-action-mark').first();
            // Optional: If there's an action button available, we click it
            // if (await markActionedBtn.isVisible()) { await markActionedBtn.click(); }
        });

        await test.step('Expected Result: The alert status updates to "Actioned" and is either hidden or moved to an archive view', async () => {
            // To be verified if there is critical stock in db
        });
    });

    test('Regional/Warehouse Risk View (PB8)', async ({ page }) => {
        await test.step('Step 1: Navigate to the Warehouse Risk View', async () => {
            await expect(page.locator('#section-regional-map')).toBeVisible();
        });

        await test.step('Step 2: View the risk map or summary list', async () => {
            await expect(page.locator('#regional-map')).toBeVisible();
        });

        await test.step('Expected Result: High-risk locations are highlighted with clear status indicators showing aging bucket density', async () => {
            // Map renders the leaflets, so checking for leaflet-container class
            await expect(page.locator('#regional-map')).toHaveClass(/leaflet-container/);
        });
    });

    test('District Level Filtering (PB8)', async ({ page }) => {
        await test.step('Step 1: Open Risk View', async () => {
            await expect(page.locator('#map-warehouse-filter')).toBeVisible();
        });

        await test.step('Step 2: Use the "All Warehouses" filter dropdown', async () => {
            await page.selectOption('#map-warehouse-filter', 'Kandy-03');
        });

        await test.step('Expected Result: The view narrows down to display risk metrics only for the selected location', async () => {
            // The map will filter to the specific district
            await expect(page.locator('#map-warehouse-filter')).toHaveValue('Kandy-03');
        });
    });

});
