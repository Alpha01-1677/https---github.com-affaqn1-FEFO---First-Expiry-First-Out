# Sprint 1 — Warehouse Dispatch Compliance Foundation
## Nestlé Smart Stock Aging Management System

---

## File Structure

```
sprint1/
├── login.html          ← PB1 · User Authentication
├── dashboard.html      ← App home (overview after login)
├── batches.html        ← PB2 · Batch Master & Expiry Database
├── scan.html           ← PB3 · Barcode Scanning Interface
├── dispatch.html       ← PB4 · FEFO Dispatch (Core Feature) + Orders history
├── orders.html         ← PB4 · Dispatch Orders History (standalone)
├── sidebar.js          ← Shared: nav, utilities, styles (imported by all pages)
└── firebase-config.js  ← Firestore schema reference (not imported directly)
```

---

## Sprint 1 Backlog Items

| ID   | Feature                    | Type         | File(s)            |
|------|----------------------------|--------------|--------------------|
| PB1  | User Authentication        | Prerequisite | login.html         |
| PB2  | Batch Master & Expiry DB   | Prerequisite | batches.html       |
| PB3  | Barcode Scanning Interface | Prerequisite | scan.html          |
| PB4  | Ensure Dispatch Decisions  | Core Feature | dispatch.html, orders.html |

---

## How to Run

1. Open `login.html` in a browser (serve via local server, e.g. `npx serve .`)
2. Use demo credentials:
   - Supervisor: `supervisor@nestle.com` / `nestle123`
   - Staff:      `staff@nestle.com`      / `nestle123`
3. Navigate using the sidebar

> ⚠️ Camera scanning (PB3) requires HTTPS in production. Works on localhost.

---

## Firestore Collections

```
users/{uid}
  - displayName: string
  - email: string
  - role: "Warehouse Supervisor" | "Warehouse Staff"

batches/{auto-id}
  - batchNumber: string        ← barcode value used in PB3
  - productName: string
  - manufacturingDate: timestamp
  - expiryDate: timestamp
  - quantity: number
  - createdAt: timestamp
  - createdBy: uid

dispatch_orders/{auto-id}
  - retailer: string
  - productName: string
  - quantityRequired: number
  - quantityFulfilled: number
  - mrslThresholdDays: number
  - status: "APPROVED" | "PARTIAL" | "REJECTED"
  - batchesUsed: [{ batchNumber, quantity, expiryDate, shelfLifePct }]
  - rejectedBatches: [{ batchNumber, reason }]
  - processedAt: timestamp
  - processedBy: uid
```

---

## Acceptance Criteria Checklist

### PB1 — User Authentication
- [x] Valid credentials → user logged in, redirected to dashboard
- [x] Invalid credentials → login rejected with error message
- [x] System assigns access based on user role (sidebar shows role chip)

### PB2 — Batch Master & Expiry Database
- [x] System stores batchNumber, manufacturingDate, expiryDate, quantity
- [x] All stored data retrieved accurately (real-time Firestore onSnapshot)
- [x] System rejects incomplete or invalid data (client-side validation)
- [x] Duplicate batch numbers rejected

### PB3 — Barcode Scanning Interface
- [x] Valid barcode → correct batch details displayed
- [x] Scanned batch shows dispatch eligibility link
- [x] Invalid or unmatched scans → error shown
- [x] Dual engine: BarcodeDetector API (native) + QuaggaJS (fallback)

### PB4 — Ensure Dispatch Decisions (Core Feature)
- [x] System selects batches using FEFO rule (earliest expiry first)
- [x] Products violating MRSL are blocked (< 20% shelf life OR < 30d)
- [x] Valid batches → APPROVED and written to Firestore
- [x] Invalid batches → REJECTED with reason shown
- [x] Partial fulfillment handled (PARTIAL status)
