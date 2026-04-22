const { test, expect } = require('@playwright/test');

test.describe('Sprint 2: Manual Test Cases - User Authentication (PB1)', () => {

    test.beforeEach(async ({ page }) => {
        await test.step('Navigate to login page', async () => {
            await page.goto('http://127.0.0.1:8080/index.html');
        });
    });

    test('Test Case 1: Valid credentials → user logged in (Management Portal)', async ({ page }) => {
        await test.step('Step 1: Ensure Management Portal tab is active', async () => {
            await expect(page.locator('#tab-supervisor')).toHaveClass(/active/);
        });

        await test.step('Step 2: Enter valid Supervisor credentials', async () => {
            // Use demo credentials helper
            await page.click('button:has-text("Supervisor")');
            
            // Verify form is filled
            await expect(page.locator('#login-email')).toHaveValue('supervisor@nestle.com');
            await expect(page.locator('#login-password')).toHaveValue('nestle123');
        });

        await test.step('Step 3: Click the Login button', async () => {
            await page.click('#login-btn');
        });

        await test.step('Step 4: Verify Success Toast appears', async () => {
            await expect(page.locator('#success-toast')).toBeVisible({ timeout: 10000 });
        });

        await test.step('Step 5: Verify Redirection to dashboard', async () => {
            await page.waitForURL('**/dashboard.html', { timeout: 10000 });
        });
    });

    test('Test Case 2: Invalid credentials → login rejected with message', async ({ page }) => {
        await test.step('Step 1: Enter invalid credentials', async () => {
            await page.fill('#login-email', 'wrong@nestle.com');
            await page.fill('#login-password', 'wrongpass');
        });

        await test.step('Step 2: Click the Login button', async () => {
            await page.click('#login-btn');
        });

        await test.step('Step 3: Verify the error message appears', async () => {
            const errorEl = page.locator('#login-error');
            await expect(errorEl).toBeVisible({ timeout: 10000 });
            await expect(page.locator('#login-error-msg')).toContainText('Invalid email or password');
        });
    });

    test('Test Case 3: System assigns access based on user role (Warehouse Staff)', async ({ page }) => {
        await test.step('Step 1: Switch to Warehouse Staff tab', async () => {
            await page.click('#tab-staff');
            await expect(page.locator('#tab-staff')).toHaveClass(/active/);
        });

        await test.step('Step 2: Enter valid Staff credentials', async () => {
            await page.click('button:has-text("Staff")');
        });

        await test.step('Step 3: Click the Login button', async () => {
            await page.click('#login-btn');
        });

        await test.step('Step 4: Verify Success Toast appears', async () => {
            await expect(page.locator('#success-toast')).toBeVisible({ timeout: 10000 });
        });

        await test.step('Step 5: Verify Redirection to Batches page for staff', async () => {
            await page.waitForURL('**/batches.html', { timeout: 10000 });
        });
    });
});
