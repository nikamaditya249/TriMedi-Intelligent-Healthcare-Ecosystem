# TriMedi Intelligent Healthcare Ecosystem
## PayPal Payment Architecture & Transaction Engine

**Document Reference:** `docs/payments/PAYPAL_ARCHITECTURE.md`  
**Classification:** Financial Systems & Payment Gateway Architecture  
**Status:** **TECHNICALLY IMPLEMENTED (16/16 PASS) ✅ | LIVE MERCHANT ACTIVATION BLOCKED ⚠️**  

---

### 1. Executive Summary & Policy Scope

> [!IMPORTANT]
> **PAYPAL IS THE SOLE PRIMARY ONLINE PAYMENT PROVIDER.**
> - PayPal REST API v2 is the authoritative online payment gateway for the TriMedi Intelligent Healthcare Ecosystem.
> - **Razorpay is NOT part of the current production payment strategy** and must not be treated as a production requirement or blocker.
> - **Current Status:** The technical integration is 100% verified across 16 automated tests. However, **PayPal LIVE merchant activation and live credentials remain externally blocked** pending corporate onboarding.

---

### 2. Transaction Architecture & Flow

```
┌──────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│ Patient Cart │ ──> │ POST /create-order   │ ──> │ PayPal Orders API v2 │
└──────────────┘     └──────────┬───────────┘     └──────────┬───────────┘
                                │                            │
                     Server-Authoritative                    │
                     Pricing + GST Computed                  │
                     Stock Atomically Reserved               │
                                │                            ▼
┌──────────────┐     ┌──────────▼───────────┐     ┌──────────────────────┐
│ Confirmed Rx │ <── │ POST /capture-order  │ <── │ Patient Approves in  │
│ Order [PAID] │     └──────────┬───────────┘     │ PayPal Modal         │
└──────────────┘                │                 └──────────────────────┘
                     Stock Committed Atomically
                     Audit Record Logged
                                │
                     ┌──────────▼───────────┐
                     │ Webhook Replay Check │
                     │ & Deduplication      │
                     └──────────────────────┘
```

---

### 3. Core Technical Invariants & Safeguards

#### A. Server-Authoritative Pricing & Taxation
- **Price Integrity:** Client-submitted prices or amounts are strictly ignored.
- **Authoritative Catalog Lookup:** Product unit prices are resolved directly from MongoDB `products` collection.
- **Dual-Tax GST Calculation:**
  - Intrastate Supply (same state): Splits 12% GST into CGST 6% + SGST 6% (IGST = 0).
  - Interstate Supply (different state): Applies 100% IGST 12% (CGST = 0, SGST = 0).
- **Currency Conversion:** Base catalog in INR ($\text{₹}$) is converted at authoritative server-side exchange rates for PayPal USD settlement.

#### B. Inventory Concurrency & Two-Phase Commit
1. **Phase 1 (Order Creation):**
   - Stock is reserved atomically using MongoDB ACID transactions.
   - Concurrency lock ensures: $\text{Available Stock} = \text{Total Stock} - \text{Reserved Stock} \ge 0$.
   - Overselling is physically impossible under concurrent requests.
2. **Phase 2 (Capture Verification):**
   - Upon successful capture from PayPal, reserved stock is permanently committed and decremented.
   - If payment fails or is denied, the reserved stock is released back into inventory.

#### C. Prescription Safety Interceptor
- Before a PayPal order can be created, cart items are evaluated against prescription rules.
- Any Schedule H/X drug in the cart without a linked, doctor-approved `ACTIVE` prescription ID is rejected with HTTP 422 (`Prescription validation failed`).

#### D. Cryptographic Webhook Security
- **Authoritative Webhook Endpoint:** `https://api.trimedi.health/api/paypal/webhook`
- **Supported Events:**
  - `PAYMENT.CAPTURE.COMPLETED`: Marks order `PAID`, commits stock, triggers pharmacy fulfillment queue.
  - `PAYMENT.CAPTURE.DENIED`: Marks order `CANCELLED`, releases reserved stock, audits security event.
  - `PAYMENT.CAPTURE.REFUNDED`: Transitions order to `REJECTED`, releases stock, logs clinical audit.
- **Replay Neutralization:** Deduplication cache intercepts replayed webhook delivery IDs, returning `isDuplicate: true` with HTTP 200 without double-fulfilling orders.

#### E. Bounded Refund Logic
- **Bounds Checking:** A refund request cannot exceed the total amount originally paid on the order. Excess amounts are strictly rejected with HTTP 400.
- **Idempotent Refunds:** Multiple refund retries return the existing refund identifier.

#### F. Automated Payment Reconciliation
- `ReconciliationService` executes scheduled background scans of orders in `PENDING` status.
- Queries PayPal REST API; if capture succeeded out-of-band, the order is safely transitioned to `PAID`.

---

### 4. Remaining External Activation Steps

To transition PayPal from sandbox to live production:
1. Complete PayPal Business merchant KYC verification.
2. Create production REST API application in Live mode on `developer.paypal.com`.
3. Configure `PAYPAL_ENVIRONMENT=live`, `PAYPAL_CLIENT_ID`, and `PAYPAL_CLIENT_SECRET` in secure production deployment variables.
4. Register `https://api.trimedi.health/api/paypal/webhook` in the Live Developer Dashboard.
