/**
 * seed_test_data.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Populates Firestore with test data that exercises PB12, PB13, and PB14.
 *
 * BEFORE RUNNING:
 *   1. Download your Firebase Service Account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save it as:  scratch/serviceAccountKey.json
 *   3. Run from the scratch/ folder:
 *        node seed_test_data.js
 *
 * WHAT IT SEEDS:
 *   • batches        – 5 batches with varying urgency (drives PB14 velocity warnings)
 *   • live_campaigns – 3 campaigns in various states (drives PB12 end-campaign & PB13 ROI)
 *   • audit_logs     – 2 audit entries (PB15 audit trail, referenced by PB13 ROI)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return admin.firestore.Timestamp.fromDate(d);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return admin.firestore.Timestamp.fromDate(d);
}

// ── Batch Data ────────────────────────────────────────────────────────────────
//
// HOW QUANTITIES WORK IN THIS SYSTEM:
// ─────────────────────────────────────────────────────────────────────────────
//
//  quantity          = REMAINING units currently in the warehouse (what's left)
//  originalQuantity  = TOTAL units when the batch was first received
//  initialQuantity   = same as originalQuantity (fallback alias used by PB14 engine)
//  promotedQty       = how many units are already locked in active promotions
//
//  ► soldQty (calculated by PB14 engine, NOT stored):
//      soldQty = originalQuantity - quantity
//
//  ► remainingQty (used by Promo Modal, NOT stored):
//      remainingQty = quantity - promotedQty
//      → This is the max the manager can offer in a new promotion
//
// PB14 VELOCITY FORMULAS (computed live in dashboard.html):
//   requiredVelocity  = Math.ceil(quantity / daysLeft)        [units/day needed]
//   historicalVelocity = Math.round(soldQty / daysSinceCreated) [units/day actual]
//   velocityGap%       = (requiredVelocity - historicalVelocity) / requiredVelocity × 100
//   → Batch is flagged if historicalVelocity < requiredVelocity
//
// ─────────────────────────────────────────────────────────────────────────────
// BATCH SUMMARY (all maths pre-verified below):
//
//  BATCH-001  Nestle KitKat        180 days left  → PB14 MILD     (Stock Clearance / 10%)
//  BATCH-002  Nestle Milo Powder    28 days left  → PB14 MODERATE (Weekend Special / 25%)
//  BATCH-003  Nestle Maggi Noodles  12 days left  → PB14 SEVERE   (Flash Sale - Final Markdown / 40%)
//  BATCH-004  Nestle Fresh Milk      8 days left  → PB14 DAIRY    (Flash Sale - Fresh Clearance / 50%)
//  BATCH-005  Nestle Munch Bar      90 days left  → NO WARNING    (selling fast enough)
//
// Batches 001–004 are set to "escalated" so they show in the Financial Review
// Queue with a "Trigger Promo" button (PB12 feature).

const BATCHES = [
  {
    // ════════════════════════════════════════════════════════════
    // BATCH-001 · Nestle KitKat  ·  PB14 → MILD RISK (10%)
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantity         = 2,000  ← remaining in warehouse right now
    //   originalQuantity = 2,500  ← total when batch arrived
    //   soldQty (calc)   =   500  ← (2500 - 2000)
    //   promotedQty      =     0  ← nothing locked in promotions yet
    //   remainingQty     = 2,000  ← (quantity - promotedQty) → max manager can offer
    //
    // PB14 VELOCITY CHECK (daysLeft=180, daysSinceCreated=120):
    //   requiredVelocity  = ceil(2000 / 180) = ceil(11.1) = 12 u/day
    //   historicalVelocity = round(500 / 120) = round(4.2) =  4 u/day
    //   velocityGap%      = (12 - 4) / 12 × 100 = 67%
    //   ⚠ flagged: historicalVelocity(4) < requiredVelocity(12)
    //   Rule 1 (daysLeft>30 AND gap<30%) → NOT met (gap is 67%)
    //   Rule 2 (daysLeft<=30 OR gap>=30%) → met (gap=67% >=30%)
    //   → Moderate Risk? NO — daysLeft=180 also matters for Smart Rec engine
    //
    // SMART RECOMMENDATION ENGINE (sales_manager_portal.html):
    //   velocityGap for rec engine = different calculation (uses promotedQty logic)
    //   With batch manufactured 120 days ago, elapsedRatio ≈ 0.4
    //   expectedSold = 2500×0.4 = 1000, soldQty = 500, gap ≈ 20%
    //   daysLeft=180 > 30, gap=20% < 30% → MILD RISK
    //   ✅ Expected title: "Stock Clearance"  discount: 10%
    // ════════════════════════════════════════════════════════════
    batchNumber:       'BATCH-001',
    productName:       'Nestle KitKat',
    quantity:          2000,           // ← remaining warehouse stock
    originalQuantity:  2500,           // ← original batch size (500 already sold)
    initialQuantity:   2500,           // ← same as above (alias used by PB14)
    promotedQty:       0,              // ← units locked in active promotions
    status:            'escalated',
    location:          'Colombo-01',
    manufacturingDate: daysAgo(120),   // ← needed by PB14 velocity engine
    expiryDate:        daysFromNow(180),
    escalatedAt:       daysAgo(2),
    lastAlertedBucket: 'C',
    createdAt:         daysAgo(120),
  },
  {
    // ════════════════════════════════════════════════════════════
    // BATCH-002 · Nestle Milo Powder  ·  PB14 → MODERATE RISK (25%)
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantity         =   800  ← remaining in warehouse
    //   originalQuantity = 1,200  ← total batch size
    //   soldQty (calc)   =   400  ← (1200 - 800)
    //   promotedQty      =     0
    //   remainingQty     =   800  ← max manager can offer in Trigger Promo modal
    //
    // PB14 VELOCITY CHECK (daysLeft=28, daysSinceCreated=60):
    //   → daysLeft=28 <= 30 → SKIPPED by velocity engine (engine only runs for >30 days)
    //   → This batch appears in the aging Critical/Warning BUCKETS instead
    //
    // SMART RECOMMENDATION ENGINE:
    //   daysLeft=28 <= 30 → hits Rule 2 (Moderate Risk) directly
    //   ✅ Expected title: "Weekend Special"  discount: 25%
    // ════════════════════════════════════════════════════════════
    batchNumber:       'BATCH-002',
    productName:       'Nestle Milo Powder',
    quantity:          800,            // ← remaining warehouse stock
    originalQuantity:  1200,           // ← 400 units have already been sold
    initialQuantity:   1200,
    promotedQty:       0,              // ← nothing locked in promos yet
    status:            'escalated',
    location:          'Kandy-03',
    manufacturingDate: daysAgo(60),
    expiryDate:        daysFromNow(28),
    escalatedAt:       daysAgo(5),
    lastAlertedBucket: 'B',
    createdAt:         daysAgo(60),
  },
  {
    // ════════════════════════════════════════════════════════════
    // BATCH-003 · Nestle Maggi Noodles  ·  PB14 → SEVERE RISK (40%)
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantity         = 1,500  ← ALL units still in warehouse (nothing sold!)
    //   originalQuantity = 1,500  ← same — zero sales in 80 days
    //   soldQty (calc)   =     0  ← (1500 - 1500)
    //   promotedQty      =     0
    //   remainingQty     = 1,500  ← full batch available to offer
    //
    // PB14 VELOCITY CHECK (daysLeft=12):
    //   → daysLeft=12 <= 30 → SKIPPED by velocity engine
    //   → Goes straight to Critical aging bucket
    //
    // SMART RECOMMENDATION ENGINE:
    //   daysLeft=12 <= 15 AND velocityGap ≈ 100% (nothing sold) → SEVERE RISK
    //   ✅ Expected title: "Flash Sale - Final Markdown"  discount: 40%
    // ════════════════════════════════════════════════════════════
    batchNumber:       'BATCH-003',
    productName:       'Nestle Maggi Noodles',
    quantity:          1500,           // ← full batch, zero sales in 80 days
    originalQuantity:  1500,           // ← same: soldQty will be 0
    initialQuantity:   1500,
    promotedQty:       0,
    status:            'escalated',
    location:          'Galle-02',
    manufacturingDate: daysAgo(80),
    expiryDate:        daysFromNow(12),
    escalatedAt:       daysAgo(1),
    lastAlertedBucket: 'A',
    createdAt:         daysAgo(80),
  },
  {
    // ════════════════════════════════════════════════════════════
    // BATCH-004 · Nestle Fresh Milk  ·  PB14 → DAIRY CRITICAL (50%)
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantity         = 500  ← all remaining (nothing sold)
    //   originalQuantity = 500
    //   soldQty (calc)   =   0  ← (500 - 500)
    //   promotedQty      =   0
    //   remainingQty     = 500  ← manager can offer all 500 units
    //
    // SMART RECOMMENDATION ENGINE:
    //   productName contains "milk" → isDairy = TRUE
    //   daysLeft=8 <= 10 → Dairy Critical Rule overrides ALL other rules
    //   ✅ Expected title: "Flash Sale - Fresh Clearance"  discount: 50%
    //
    // NOTE: This batch has daysLeft=8 so it is SKIPPED by the PB14 velocity
    //       engine (engine only checks batches with daysLeft > 30). It will
    //       appear in the Critical aging bucket row instead.
    // ════════════════════════════════════════════════════════════
    batchNumber:       'BATCH-004',
    productName:       'Nestle Fresh Milk',   // "milk" → isDairy = true in PB14 engine
    quantity:          500,            // ← remaining warehouse stock
    originalQuantity:  500,            // ← nothing sold (new batch, immediate issue)
    initialQuantity:   500,
    promotedQty:       0,
    status:            'escalated',
    location:          'Negombo-04',
    manufacturingDate: daysAgo(15),
    expiryDate:        daysFromNow(8),
    escalatedAt:       FieldValue.serverTimestamp(),
    lastAlertedBucket: 'A',
    createdAt:         daysAgo(15),
  },
  {
    // ════════════════════════════════════════════════════════════
    // BATCH-005 · Nestle Munch Bar  ·  NO PB14 WARNING
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantity         =   300  ← only 300 left (selling fast!)
    //   originalQuantity = 1,500  ← started with 1,500 units
    //   soldQty (calc)   = 1,200  ← (1500 - 300) sold in just 30 days
    //   promotedQty      =     0
    //   remainingQty     =   300  ← what manager could offer if needed
    //
    // PB14 VELOCITY CHECK (daysLeft=90, daysSinceCreated=30):
    //   requiredVelocity   = ceil(300 / 90)   = ceil(3.3) =  4 u/day
    //   historicalVelocity = round(1200 / 30) = round(40) = 40 u/day
    //   historicalVelocity(40) >= requiredVelocity(4) → NOT flagged ✅
    //   ✅ This batch should NOT appear in the Early Warnings section
    // ════════════════════════════════════════════════════════════
    batchNumber:       'BATCH-005',
    productName:       'Nestle Munch Bar',
    quantity:          300,            // ← only 300 left, nearly sold out
    originalQuantity:  1500,           // ← 1,200 units sold in 30 days
    initialQuantity:   1500,
    promotedQty:       0,
    status:            'active',       // not escalated — healthy batch
    location:          'Colombo-01',
    manufacturingDate: daysAgo(30),
    expiryDate:        daysFromNow(90),
    lastAlertedBucket: 'C',
    createdAt:         daysAgo(30),
  },
];

// ── Live Campaign Data ────────────────────────────────────────────────────────
//
// HOW QUANTITIES WORK IN live_campaigns:
// ─────────────────────────────────────────────────────────────────────────────
//   quantityAvailable = units the retailer can still claim (remaining offer)
//   soldUnits         = units already claimed/sold by the retailer
//
//   ► Total units originally offered = quantityAvailable + soldUnits
//   ► clearanceRate = soldUnits / (quantityAvailable + soldUnits) × 100
//
//   The clearanceRate per retailer per product is used by PB12's Intelligent
//   Retailer Dropdown to rank retailers as "Top Performers" (rate >= 50%).
//
//   PB13 ROI Dashboard reads:
//     Rescued units  = sum of soldUnits across ALL campaigns
//     Lost/expired   = quantityAvailable of "declined" or "ended" campaigns
//
// CAMPAIGNS SUMMARY:
//   CAMP-01  KitKat   active   800 sold / 200 remaining → clearance 80% → Top Performer
//   CAMP-02  Milo     active     0 sold / 800 remaining → open offer in retailer portal
//   CAMP-03  Maggi    ended  1,450 sold /  50 remaining → PB13 rescued units history
//   CAMP-04  Munch    declined   0 sold / 300 remaining → PB13 declined/lost tracking
// ─────────────────────────────────────────────────────────────────────────────

// retailer1@nestle.com Firestore UID — REPLACE with the real value.
// Firebase Console → Authentication → Users → find retailer1@nestle.com → copy UID
const RETAILER1_UID = 'REPLACE_WITH_RETAILER1_UID'; // ← IMPORTANT: update this

const LIVE_CAMPAIGNS = [
  {
    // ════════════════════════════════════════════════════════════
    // CAMPAIGN-01 · KitKat · Status: active
    // PB12: "End Campaign" button visible to Sales Manager
    // PB12 Retailer Dropdown: retailer1 ranked as TOP PERFORMER
    // PB13: 800 soldUnits count toward "Rescued" total
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantityAvailable = 200  ← units retailer1 hasn't claimed yet
    //   soldUnits         = 800  ← units already sold / collected
    //   Total offered     = 200 + 800 = 1,000 units
    //   clearanceRate     = 800 / 1000 × 100 = 80%
    //   → 80% >= 50% threshold → retailer1 appears in "Top Performers" group
    //      for KitKat when the next KitKat promo modal is opened (PB12)
    //
    batchID:           'BATCH-001-ID',  // patched by script with real Firestore doc ID
    batchNumber:       'BATCH-001',
    productName:       'Nestle KitKat',
    quantityAvailable: 200,             // ← still claimable by retailer
    soldUnits:         800,             // ← already sold (drives Top Performer ranking)
    retailerID:        RETAILER1_UID,
    promotionTitle:    'Weekend KitKat Clearance',
    discountPercent:   10,
    startDate:         new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    endDate:           new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status:            'active',
    createdAt:         daysAgo(5),
    createdBy:         'planner-uid',
    declineReason:     null,
  },
  {
    // ════════════════════════════════════════════════════════════
    // CAMPAIGN-02 · Milo Powder · Status: active (open offer)
    // PB12 Retailer Portal: retailer1 sees this as an open offer to Accept/Decline
    // PB13: soldUnits=0 → counts as unclaimed (not rescued yet)
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantityAvailable = 800  ← full batch offered, nothing claimed yet
    //   soldUnits         =   0  ← retailer hasn't accepted yet
    //   Total offered     = 800 units
    //   clearanceRate     = 0 / 800 = 0%
    //   → retailer1 appears under "Other Retailers" for future Milo promos
    //
    batchID:           'BATCH-002-ID',
    batchNumber:       'BATCH-002',
    productName:       'Nestle Milo Powder',
    quantityAvailable: 800,             // ← all 800 units waiting for retailer to accept
    soldUnits:         0,               // ← nothing accepted yet
    retailerID:        RETAILER1_UID,
    promotionTitle:    'Milo Flash Deal',
    discountPercent:   25,
    startDate:         new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    endDate:           new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    status:            'active',        // retailer sees Accept / Decline buttons
    createdAt:         daysAgo(2),
    createdBy:         'planner-uid',
    declineReason:     null,
  },
  {
    // ════════════════════════════════════════════════════════════
    // CAMPAIGN-03 · Maggi Noodles · Status: ended
    // PB13: 1,450 soldUnits → large "Rescued" contribution in ROI chart
    // PB12 Retailer Dropdown: retailer1 gets 1450/(50+1450)=96% for Maggi
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantityAvailable =    50  ← 50 units were not collected before campaign ended
    //   soldUnits         = 1,450  ← 1,450 units successfully rescued
    //   Total offered     = 1,500 units
    //   clearanceRate     = 1450 / 1500 × 100 = 96.7%
    //   → Extremely high performer for Maggi product line
    //
    // PB13 ROI impact: adds 1,450 to the "Rescued" volume card
    //
    batchID:           'BATCH-003-ID',
    batchNumber:       'BATCH-003',
    productName:       'Nestle Maggi Noodles',
    quantityAvailable: 50,              // ← 50 units uncollected when campaign ended
    soldUnits:         1450,            // ← 1,450 units rescued before expiry ✅
    retailerID:        RETAILER1_UID,
    promotionTitle:    'Maggi End-of-Season Sale',
    discountPercent:   40,
    startDate:         new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    endDate:           new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    status:            'ended',
    createdAt:         daysAgo(14),
    createdBy:         'planner-uid',
    declineReason:     null,
  },
  {
    // ════════════════════════════════════════════════════════════
    // CAMPAIGN-04 · Munch Bar · Status: declined
    // PB13: soldUnits=0 + declined → counts as "expired/lost" waste in ROI
    // PB12 Decline Analytics: declineReason stored for manager to review
    // ════════════════════════════════════════════════════════════
    //
    // QUANTITY BREAKDOWN:
    //   quantityAvailable = 300  ← all 300 units went to waste (declined)
    //   soldUnits         =   0  ← nothing sold
    //   Total offered     = 300 units
    //   clearanceRate     = 0%
    //   → PB13 ROI: these 300 units count as lost/expired inventory
    //
    batchID:           'BATCH-005-ID',
    batchNumber:       'BATCH-005',
    productName:       'Nestle Munch Bar',
    quantityAvailable: 300,             // ← all 300 units wasted (not accepted)
    soldUnits:         0,               // ← zero rescued
    retailerID:        RETAILER1_UID,
    promotionTitle:    'Munch Bar Promo',
    discountPercent:   15,
    startDate:         new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    endDate:           new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    status:            'declined',
    createdAt:         daysAgo(10),
    createdBy:         'planner-uid',
    declineReason:     'Price too high',  // ← visible in Live Promotions Monitor table
  },
];

// ── Audit Log Data (PB15 / PB13 ROI source) ───────────────────────────────────

const AUDIT_LOGS = [
  {
    timestamp:         daysAgo(5),
    action:            'PROMOTION_TRIGGERED',
    salesManagerID:    'planner-uid',
    salesManagerName:  'Test Planner',
    batchID:           'BATCH-001-ID',
    batchNumber:       'BATCH-001',
    productName:       'Nestle KitKat',
    discountPercentage: 10,
    retailerID:        RETAILER1_UID,
    retailerName:      'Retailer One',
    promotionTitle:    'Weekend KitKat Clearance',
    startDate:         new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    endDate:           new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
  },
  {
    timestamp:         daysAgo(14),
    action:            'PROMOTION_TRIGGERED',
    salesManagerID:    'planner-uid',
    salesManagerName:  'Test Planner',
    batchID:           'BATCH-003-ID',
    batchNumber:       'BATCH-003',
    productName:       'Nestle Maggi Noodles',
    discountPercentage: 40,
    retailerID:        RETAILER1_UID,
    retailerName:      'Retailer One',
    promotionTitle:    'Maggi End-of-Season Sale',
    startDate:         new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    endDate:           new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
  },
];

// ── Seeder ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Starting Firestore seed for PB12 / PB13 / PB14 test data...\n');

  // 1. Write batches
  console.log('📦 Seeding batches collection...');
  const batchIds = {};
  for (const batch of BATCHES) {
    const ref = await db.collection('batches').add(batch);
    batchIds[batch.batchNumber] = ref.id;
    console.log(`  ✅ ${batch.batchNumber} → ${batch.productName}  [ID: ${ref.id}]  Status: ${batch.status}  Days left: ~${batch.batchNumber}`);
  }

  // 2. Write live_campaigns (patch batchIDs with real Firestore IDs)
  console.log('\n📢 Seeding live_campaigns collection...');
  for (const camp of LIVE_CAMPAIGNS) {
    const realBatchId = batchIds[camp.batchNumber] || camp.batchID;
    const campData = { ...camp, batchID: realBatchId };
    const ref = await db.collection('live_campaigns').add(campData);
    console.log(`  ✅ Campaign "${camp.promotionTitle}"  Status: ${camp.status}  [ID: ${ref.id}]`);
  }

  // 3. Write audit_logs
  console.log('\n📋 Seeding audit_logs collection...');
  for (const log of AUDIT_LOGS) {
    const realBatchId = batchIds[log.batchNumber] || log.batchID;
    const logData = { ...log, batchID: realBatchId };
    const ref = await db.collection('audit_logs').add(logData);
    console.log(`  ✅ Audit log for "${log.productName}" → ${log.action}  [ID: ${ref.id}]`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('──────────────────────────────────────────────────');
  console.log('WHAT TO VERIFY IN YOUR SYSTEM:');
  console.log('');
  console.log('PB12 – End Campaign:');
  console.log('  • Login as planner@nestle.com → Sales Manager Portal');
  console.log('  • "Weekend KitKat Clearance" should show "End Campaign" button');
  console.log('  • Click it → confirm → campaign status changes to "ended"');
  console.log('');
  console.log('PB12 – Intelligent Retailer Dropdown:');
  console.log('  • Click "Trigger Promo" on any escalated batch (BATCH-001 to BATCH-004)');
  console.log('  • For KitKat: retailer1 should appear under "Top Performers" (80% success)');
  console.log('  • For other products: retailer1 appears under "Other Retailers"');
  console.log('');
  console.log('PB13 – Financial ROI Dashboard:');
  console.log('  • Navigate to /financial_roi.html as planner@nestle.com');
  console.log('  • "Rescued" card: should show ~2,450 units (800+1,450 soldUnits)');
  console.log('  • "Lost/Expired" card: should reflect the declined/zero-sold campaigns');
  console.log('  • ROI chart should render with bars for each product');
  console.log('');
  console.log('PB14 – Smart Recommendation Engine (Trigger Promo Modal):');
  console.log('  • BATCH-001 KitKat       → Title: "Stock Clearance",           Discount: 10%');
  console.log('  • BATCH-002 Milo Powder   → Title: "Weekend Special",           Discount: 25%');
  console.log('  • BATCH-003 Maggi Noodles → Title: "Flash Sale - Final Markdown", Discount: 40%');
  console.log('  • BATCH-004 Fresh Milk    → Title: "Flash Sale - Fresh Clearance", Discount: 50%');
  console.log('  • All four should show "✨ AI Recommended" hint + indigo border');
  console.log('');
  console.log('PB14 – Predictive Velocity Warnings (Dashboard):');
  console.log('  • Login → Dashboard → scroll to "Predictive Early Warnings" section');
  console.log('  • BATCH-001 KitKat should appear (slow historical velocity)');
  console.log('  • BATCH-002, BATCH-003, BATCH-004 appear with Moderate/Severe badges');
  console.log('  • BATCH-005 Munch Bar should NOT appear (selling fast enough)');
  console.log('──────────────────────────────────────────────────\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
