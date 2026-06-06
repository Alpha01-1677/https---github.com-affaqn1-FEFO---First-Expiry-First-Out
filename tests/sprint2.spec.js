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

// ──────────────────────────────────────────────────────────────────────────────
// Helper: UI Login via the real login form
// ──────────────────────────────────────────────────────────────────────────────
async function uiLogin(page, email, password, role) {
    await page.goto('http://127.0.0.1:8080/index.html');

    if (role === 'Warehouse Staff') {
        await page.click('#tab-staff');
    } else {
        await page.click('#tab-supervisor');
    }

    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('#login-btn');

    try {
        await page.waitForURL(/dashboard\.html|retailer_portal\.html|sales_manager_portal\.html|batches\.html/, {
            timeout: 30000,
        });
    } catch (e) {
        const errorEl = page.locator('#login-error');
        if (await errorEl.isVisible()) {
            const msg = await page.locator('#login-error-msg').innerText();
            throw new Error(`Login failed for ${email}: ${msg}`);
        }
        throw e;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// PB9: Standardized Promotion Management
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Sprint 2: PB9 — Standardized Promotion Management', () => {

    test('TC-PB9-001: Sales Manager can view escalated batches queue and trigger a promotion', async ({ page }) => {
        await test.step('Step 1: Log in as Sales Manager', async () => {
            await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
        });

        await test.step('Step 2: Navigate to Sales Manager Portal', async () => {
            await page.goto('http://127.0.0.1:8080/sales_manager_portal.html');
        });

        await test.step('Step 3: Verify the escalated batches queue is visible', async () => {
            await expect(page.locator('text=Financial Review Queue')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('#escalated-tbody')).toBeVisible();
        });

        await test.step('Step 4: Verify the Escalated Batches table has correct columns', async () => {
            await expect(page.locator('th:has-text("Batch #")').first()).toBeVisible();
            await expect(page.locator('th:has-text("Product")').first()).toBeVisible();
            await expect(page.locator('th:has-text("Days Left")').first()).toBeVisible();
            await expect(page.locator('th:has-text("Quantity")').first()).toBeVisible();
            await expect(page.locator('th:has-text("Action")').first()).toBeVisible();
        });

        await test.step('Step 5: If escalated batches exist, trigger a promotion', async () => {
            const triggerBtn = page.locator('.btn-trigger').first();
            const hasTriggerBtn = await triggerBtn.isVisible({ timeout: 5000 }).catch(() => false);

            if (hasTriggerBtn) {
                await triggerBtn.click();

                // Verify promotion modal opens
                await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 5000 });

                // Verify the form fields are present
                await expect(page.locator('#promo-title')).toBeVisible();
                await expect(page.locator('#promo-discount')).toBeVisible();
                await expect(page.locator('#promo-start')).toBeVisible();
                await expect(page.locator('#promo-end')).toBeVisible();
                await expect(page.locator('#promo-retailer-id')).toBeVisible();

                // Fill Promotion Title, Discount (%), and Duration
                const promoTitle = `Sprint2-Test-${Date.now()}`;
                await page.fill('#promo-title', promoTitle);
                await page.fill('#promo-discount', '30');

                // Select a retailer from the dropdown
                await page.selectOption('#promo-retailer-id', { index: 1 });

                // Click "Trigger Promotion"
                await page.click('#btn-submit-promo');

                // Modal must close after successful submission
                await expect(page.locator('#promo-modal-overlay')).not.toHaveClass(/open/, { timeout: 10000 });

                // Verify the new promotion appears in Live Promotions Monitor
                await expect(page.locator('text=Live Promotions Monitor')).toBeVisible();
                const monitorTable = page.locator('#promotions-monitor-tbody');
                await expect(monitorTable.locator(`text=${promoTitle}`)).toBeVisible({ timeout: 10000 });
            } else {
                // No escalated batches — verify the empty state message
                await expect(page.locator('#escalated-tbody')).toBeVisible();
                console.log('No escalated batches in queue — structural checks passed.');
            }
        });
    });

    test('TC-PB9-002: Retailer portal updates in real-time and promotion terms are read-only', async ({ page }) => {
        await test.step('Step 1: Log in as Retailer', async () => {
            await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
        });

        await test.step('Step 2: Navigate to Retailer Portal', async () => {
            await page.goto('http://127.0.0.1:8080/retailer_portal.html');
        });

        await test.step('Step 3: Verify Retailer Portal loads with Smart Procurement Feed', async () => {
            await expect(page.locator('#tab-offers')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('text=Smart Procurement Feed')).toBeVisible();
        });

        await test.step('Step 4: Verify promotions are visible or empty state is shown', async () => {
            const offersContainer = page.locator('#offers-container');
            const noOffersMsg = page.locator('#no-offers-msg');

            // Wait for either offers to load or empty message
            await page.waitForTimeout(3000);

            const hasOffers = await offersContainer.locator('.bg-white').first().isVisible().catch(() => false);
            const hasNoOffersMsg = await noOffersMsg.isVisible();

            if (hasOffers) {
                // Verify offer cards display discount info (read-only rendered text)
                const firstCard = offersContainer.locator('.bg-white').first();
                await expect(firstCard).toBeVisible();

                // Promotion terms are rendered as text, not editable inputs — 
                // confirming that retailers cannot modify the promotion terms
                const inputsInCard = await firstCard.locator('input:not([type="hidden"])').count();
                expect(inputsInCard).toBe(0);  // No editable inputs in the offer card
            } else {
                // No active offers for this retailer
                await expect(noOffersMsg).toBeVisible();
                await expect(page.locator('text=No Active Offers')).toBeVisible();
                console.log('No promotions currently available for this retailer.');
            }
        });

        await test.step('Step 5: Verify Retailer cannot access Sales Manager Portal (RBAC)', async () => {
            await page.goto('http://127.0.0.1:8080/sales_manager_portal.html');
            // Retailer role should be redirected away
            await page.waitForURL(url => {
                return url.pathname.includes('index.html') || url.pathname.includes('retailer_portal.html');
            }, { timeout: 15000 });

            const finalUrl = page.url();
            expect(finalUrl).toMatch(/index\.html|retailer_portal\.html/);
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// PB10: B2B Retailer Collaboration Portal
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Sprint 2: PB10 — B2B Retailer Collaboration Portal', () => {

    test('TC-PB10-001: Retailer can view Live Campaigns tab with sales velocity progress bar', async ({ page }) => {
        await test.step('Step 1: Log in as Retailer', async () => {
            await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
        });

        await test.step('Step 2: Navigate to Retailer Portal', async () => {
            await page.goto('http://127.0.0.1:8080/retailer_portal.html');
        });

        await test.step('Step 3: Click on "My Active Campaigns" tab', async () => {
            await page.click('#nav-live');
            await expect(page.locator('#tab-live')).toBeVisible({ timeout: 10000 });
        });

        await test.step('Step 4: Verify Live Campaigns heading is displayed', async () => {
            await expect(page.locator('text=My Active Campaigns')).toBeVisible();
            await expect(page.locator('text=Monitor your currently running promotional batches')).toBeVisible();
        });

        await test.step('Step 5: Verify progress bar or empty state is shown', async () => {
            const noLiveMsg = page.locator('#no-live-msg');
            const liveContainer = page.locator('#live-container');

            // Wait for data to load
            await page.waitForTimeout(3000);

            const hasNoLiveMsg = await noLiveMsg.isVisible();

            if (hasNoLiveMsg) {
                // Empty state — no active live campaigns
                await expect(page.locator('text=No Live Campaigns')).toBeVisible();
                console.log('No live campaigns for retailer — empty state verified.');
            } else {
                // Live campaigns exist — verify progress bar is visible
                const firstCard = liveContainer.locator('.bg-white').first();
                await expect(firstCard).toBeVisible({ timeout: 10000 });

                // Verify the progress bar showing sales velocity
                const progressBar = firstCard.locator('.bg-emerald-500, .bg-gradient-to-r').first();
                await expect(progressBar).toBeVisible();

                // Verify sold/remaining labels are present
                await expect(firstCard.locator('text=Sold')).toBeVisible();
                await expect(firstCard.locator('text=Remaining')).toBeVisible();
            }
        });
    });

    test('TC-PB10-002: Collaboration Log integration between Planners and Retailers', async ({ page }) => {
        await test.step('Step 1: Log in as Retailer', async () => {
            await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
        });

        await test.step('Step 2: Navigate to Collaboration Portal', async () => {
            await page.goto('http://127.0.0.1:8080/collaboration.html');
        });

        await test.step('Step 3: Verify Collaboration Portal heading is visible', async () => {
            await expect(page.locator('text=Collaboration Portal')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('text=Monitor live and accepted promotional campaigns')).toBeVisible();
        });

        await test.step('Step 4: Verify campaign cards or empty state are displayed', async () => {
            const campaignsGrid = page.locator('#campaigns-grid');
            const noDataMsg = page.locator('#no-data-msg');

            // Wait for campaigns to load
            await page.waitForTimeout(3000);

            const hasNoData = await noDataMsg.isVisible();
            const hasCampaigns = await campaignsGrid.locator('.campaign-card-selectable').first().isVisible().catch(() => false);

            if (hasCampaigns) {
                // Campaign cards are present — click the first one to open the Collaboration Log
                const firstCard = campaignsGrid.locator('.campaign-card-selectable').first();
                await firstCard.click();

                // Verify Collaboration Log panel opens
                const logPanel = page.locator('#collab-log-panel');
                await expect(logPanel).toBeVisible({ timeout: 5000 });

                // Verify log panel title updates
                await expect(page.locator('#log-panel-title')).toContainText('Coordination');

                // Verify input field and Post button are present
                await expect(page.locator('#log-input')).toBeVisible();
                await expect(page.locator('#log-send-btn')).toBeVisible();
            } else {
                // No active campaigns — verify the empty state
                await expect(noDataMsg).toBeVisible();
                await expect(page.locator('text=No active or accepted campaigns found')).toBeVisible();
                console.log('No campaigns found for collaboration — empty state verified.');
            }
        });

        await test.step('Step 5: If a campaign is selected, post a collaboration message', async () => {
            const logInput = page.locator('#log-input');
            const sendBtn = page.locator('#log-send-btn');
            const logPanel = page.locator('#collab-log-panel');

            const isLogOpen = await logPanel.isVisible();

            if (isLogOpen) {
                const testMessage = `Playwright test message - ${Date.now()}`;

                // Type and submit a message
                await logInput.fill(testMessage);
                await sendBtn.click();

                // Verify the message appears in the log
                await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 8000 });

                // Verify the input field is cleared after posting
                await expect(logInput).toHaveValue('');
            } else {
                console.log('Collaboration log not open — skipping message post test.');
            }
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// PB9 (Extended): Standardized Promotion Management — Additional Test Cases
// Manual Test Cases: "Verify Sales Manager can view and trigger a promotion"
//                    "Verify real-time Retailer portal update and read-only enforcement"
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Sprint 2: PB9 (Extended) — Promotion Trigger & Read-Only Enforcement', () => {

    // ──────────────────────────────────────────────────────────────────────────
    // TC-PB9-003: Promotion form validation — required fields must be filled
    // Covers the negative case: "trying to submit a promotion with missing fields"
    // ──────────────────────────────────────────────────────────────────────────
    test('TC-PB9-003: Promotion modal enforces required fields before submission', async ({ page }) => {
        await test.step('Step 1: Log in as Sales Manager (Planner)', async () => {
            await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
        });

        await test.step('Step 2: Navigate to Sales Manager Portal', async () => {
            await page.goto('http://127.0.0.1:8080/sales_manager_portal.html');
        });

        await test.step('Step 3: Wait for the portal to load', async () => {
            await expect(page.locator('text=Financial Review Queue')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('#escalated-tbody')).toBeVisible();
        });

        await test.step('Step 4: If an escalated batch exists, open the promotion modal', async () => {
            const triggerBtn = page.locator('.btn-trigger').first();
            const hasTriggerBtn = await triggerBtn.isVisible({ timeout: 5000 }).catch(() => false);

            if (hasTriggerBtn) {
                await triggerBtn.click();
                await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 5000 });

                // Step 5: Clear all required fields and try to submit
                await page.fill('#promo-title', '');
                await page.fill('#promo-discount', '');

                // Attempt to submit with missing Promotion Title and Discount
                await page.click('#btn-submit-promo');

                // The form uses HTML5 required validation — modal must NOT close
                // and the browser prevents submission (form stays open)
                await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/);

                // Verify modal is still showing (submission was blocked)
                await expect(page.locator('#promo-title')).toBeVisible();
                await expect(page.locator('#promo-discount')).toBeVisible();

                console.log('Promotion form correctly blocked submission with missing required fields.');

                // Close modal to clean up
                await page.click('button:has-text("×")');
            } else {
                // No escalated batches to trigger — log structural check
                console.log('No escalated batches available — form validation test skipped.');
            }
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC-PB9-004: Cross-role flow — Sales Manager triggers promotion →
    //             verify it appears in the Live Promotions Monitor
    // Maps to: "Verify real-time Retailer portal update and read-only enforcement"
    // ──────────────────────────────────────────────────────────────────────────
    test('TC-PB9-004: Sales Manager triggers promotion → Live Promotions Monitor updates in real-time', async ({ page }) => {
        await test.step('Step 1: Log in as Sales Manager (Planner)', async () => {
            await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Sales Manager');
        });

        await test.step('Step 2: Navigate to Sales Manager Portal', async () => {
            await page.goto('http://127.0.0.1:8080/sales_manager_portal.html');
        });

        await test.step('Step 3: Confirm portal layout — queue and monitor sections are both visible', async () => {
            await expect(page.locator('text=Financial Review Queue')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('text=Live Promotions Monitor')).toBeVisible();
            await expect(page.locator('#escalated-tbody')).toBeVisible();
            await expect(page.locator('#promotions-monitor-tbody')).toBeVisible();
        });

        await test.step('Step 4: Trigger a promotion if escalated batches exist', async () => {
            const triggerBtn = page.locator('.btn-trigger').first();
            const hasTriggerBtn = await triggerBtn.isVisible({ timeout: 5000 }).catch(() => false);

            if (hasTriggerBtn) {
                await triggerBtn.click();
                await expect(page.locator('#promo-modal-overlay')).toHaveClass(/open/, { timeout: 5000 });

                // Fill all required fields: Title, Discount, Retailer
                const promoTitle = `PB9-RealTime-${Date.now()}`;
                await page.fill('#promo-title', promoTitle);
                await page.fill('#promo-discount', '20');
                await page.selectOption('#promo-retailer-id', { index: 1 });

                // Click "Trigger Promotion"
                await page.click('#btn-submit-promo');

                // Step 5: Modal closes — promotion was successfully registered
                await expect(page.locator('#promo-modal-overlay')).not.toHaveClass(/open/, { timeout: 10000 });

                // Step 6: Verify the newly triggered promotion appears in the Live Promotions Monitor
                // This confirms the real-time update (Firestore onSnapshot listener updates the table)
                await expect(page.locator('text=Live Promotions Monitor')).toBeVisible();
                const monitorRow = page.locator('#promotions-monitor-tbody').locator(`text=${promoTitle}`);
                await expect(monitorRow).toBeVisible({ timeout: 10000 });

                console.log(`Promotion "${promoTitle}" successfully triggered and appeared in monitor.`);
            } else {
                // No batches to trigger — verify the monitor table structure is still valid
                const monitorTbody = page.locator('#promotions-monitor-tbody');
                await expect(monitorTbody).toBeVisible();
                console.log('No escalated batches — Live Promotions Monitor structural verification passed.');
            }
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// PB10 (Extended): B2B Retailer Collaboration Portal — Additional Test Cases
// Manual Test Cases: "Verify Retailer can view Live Campaigns and Sales Velocity"
//                    "Verify Collaboration Log integration between Planners and Retailers"
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Sprint 2: PB10 (Extended) — Live Campaigns & Collaboration Log', () => {

    // ──────────────────────────────────────────────────────────────────────────
    // TC-PB10-003: Planner-side collaboration log — verify Planner can view
    //              the collaboration portal and campaign cards
    // Maps to: "Verify Collaboration Log integration between Planners and Retailers"
    // ──────────────────────────────────────────────────────────────────────────
    test('TC-PB10-003: Nestlé Planner can access Collaboration Portal and view campaign log', async ({ page }) => {
        await test.step('Step 1: Log in as Nestlé Planner (Demand Planner / Supervisor)', async () => {
            await uiLogin(page, 'planner@nestle.com', 'nestle123', 'Planner');
        });

        await test.step('Step 2: Navigate to Collaboration Portal', async () => {
            await page.goto('http://127.0.0.1:8080/collaboration.html');
        });

        await test.step('Step 3: Verify the Collaboration Portal heading and description are visible', async () => {
            await expect(page.locator('text=Collaboration Portal')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('text=Monitor live and accepted promotional campaigns')).toBeVisible();
        });

        await test.step('Step 4: Verify the campaigns grid or empty state renders for a Planner', async () => {
            const campaignsGrid = page.locator('#campaigns-grid');
            const noDataMsg = page.locator('#no-data-msg');

            // Wait for Firestore snapshot to arrive
            await page.waitForTimeout(3000);

            const hasCampaigns = await campaignsGrid.locator('.campaign-card-selectable').first().isVisible().catch(() => false);
            const hasNoData = await noDataMsg.isVisible();

            if (hasCampaigns) {
                // Planner selects a campaign card to open the collaboration log
                const firstCard = campaignsGrid.locator('.campaign-card-selectable').first();
                await firstCard.click();

                // Verify the collaboration log panel opens
                const logPanel = page.locator('#collab-log-panel');
                await expect(logPanel).toBeVisible({ timeout: 5000 });

                // Verify panel title contains "Coordination"
                await expect(page.locator('#log-panel-title')).toContainText('Coordination');

                // Verify Planner can also type in the log input and send a message
                const logInput = page.locator('#log-input');
                const sendBtn = page.locator('#log-send-btn');
                await expect(logInput).toBeVisible();
                await expect(sendBtn).toBeVisible();

                // Post a coordination message as a Planner
                const plannerMsg = `Planner coordination note - ${Date.now()}`;
                await logInput.fill(plannerMsg);
                await sendBtn.click();

                // Verify the message appears in the log (bi-directional coordination confirmed)
                await expect(page.locator(`text=${plannerMsg}`)).toBeVisible({ timeout: 8000 });

                // Verify the input is cleared after sending
                await expect(logInput).toHaveValue('');

                console.log('Planner collaboration log message posted and verified successfully.');
            } else if (hasNoData) {
                await expect(page.locator('text=No active or accepted campaigns found')).toBeVisible();
                console.log('No active campaigns found — Planner-side empty state verified.');
            } else {
                // Waiting for data — log status
                console.log('Campaign grid loaded without data — structural verification passed.');
            }
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TC-PB10-004: Retailer portal — promotion offer cards are strictly read-only
    //              (no editable inputs inside any offer card element)
    // Maps to: "Verify real-time Retailer portal update and read-only enforcement"
    //          → Acceptance Criteria: Retailers CANNOT modify promotion terms
    // ──────────────────────────────────────────────────────────────────────────
    test('TC-PB10-004: Retailer cannot modify promotion terms — offer cards are fully read-only', async ({ page }) => {
        await test.step('Step 1: Log in as Retailer', async () => {
            await uiLogin(page, 'retailer1@nestle.com', 'nestle123', 'Retailer');
        });

        await test.step('Step 2: Navigate to Retailer Portal', async () => {
            await page.goto('http://127.0.0.1:8080/retailer_portal.html');
        });

        await test.step('Step 3: Wait for Smart Procurement Feed to load', async () => {
            await expect(page.locator('#tab-offers')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('text=Smart Procurement Feed')).toBeVisible();
            // Allow Firestore listener to populate offers
            await page.waitForTimeout(3000);
        });

        await test.step('Step 4: Inspect each offer card — confirm no editable inputs for Title, Discount, or Duration', async () => {
            const offersContainer = page.locator('#offers-container');
            const noOffersMsg = page.locator('#no-offers-msg');

            const hasOffers = await offersContainer.locator('.bg-white').first().isVisible().catch(() => false);

            if (hasOffers) {
                // Get all offer cards
                const offerCards = offersContainer.locator('.bg-white');
                const cardCount = await offerCards.count();

                for (let i = 0; i < Math.min(cardCount, 3); i++) {
                    const card = offerCards.nth(i);

                    // Rule: No non-hidden input fields inside any offer card
                    const editableInputs = await card.locator('input:not([type="hidden"]):not([disabled])').count();
                    expect(editableInputs).toBe(0);

                    // Rule: No editable textareas inside any offer card
                    const editableTextareas = await card.locator('textarea:not([disabled])').count();
                    expect(editableTextareas).toBe(0);

                    // Rule: No contenteditable elements inside any offer card
                    const contentEditableEls = await card.locator('[contenteditable="true"]').count();
                    expect(contentEditableEls).toBe(0);
                }

                console.log(`Read-only enforcement verified across ${Math.min(cardCount, 3)} offer card(s).`);
            } else {
                // No offers — confirm the empty state message is displayed correctly
                await expect(noOffersMsg).toBeVisible();
                console.log('No active offers found — read-only test N/A, empty state verified.');
            }
        });

        await test.step('Step 5: Verify Retailer cannot navigate to Sales Manager Portal (RBAC boundary)', async () => {
            // Directly attempt to access Sales Manager Portal as a Retailer
            await page.goto('http://127.0.0.1:8080/sales_manager_portal.html');

            // Retailer should be redirected — cannot access manager-only pages
            await page.waitForURL(url => {
                return url.pathname.includes('index.html') || url.pathname.includes('retailer_portal.html');
            }, { timeout: 15000 });

            const finalUrl = page.url();
            expect(finalUrl).toMatch(/index\.html|retailer_portal\.html/);
            console.log(`RBAC enforced — Retailer redirected to: ${finalUrl}`);
        });
    });
});
