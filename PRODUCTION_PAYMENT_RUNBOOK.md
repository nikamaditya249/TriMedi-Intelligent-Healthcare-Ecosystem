# TriMedi Production Payment Runbook (PayPal Integration)

**Platform:** TriMedi Intelligent Healthcare Ecosystem  
**Milestone:** Phase 5.95 — Final Production Blocker Clearance  
**Primary Payment Gateway:** PayPal Inc. (PayPal REST API v2)  
**Document Classification:** Standard Operating Procedure (SOP) & Payment Runbook  
**Last Updated:** October 17, 2026  

---

## 1. Executive Summary & Architecture

The TriMedi payment engine is architected around **server-authoritative pricing**, **concurrency-safe inventory reservations**, and **atomic capture verification**. As of Phase 5.95, **PayPal** serves as the primary production payment gateway, replacing legacy domestic requirements and providing global PCI-DSS Level 1 compliant financial settlement.

```
                              PATIENT CHECKOUT
                                     ↓
                    [POST /api/paypal/create-order]
                                     ↓
                     SERVER-AUTHORITATIVE PRICING
             - Ignored client-supplied totals & prices
             - Base price from database catalog
             - Statutory GST: CGST 6% + SGST 6% (or IGST 12%)
             - Fixed Delivery: ₹40 (free above ₹500)
                                     ↓
                     CLINICAL PRESCRIPTION VALIDATION
             - Controlled drugs require approved active Rx
                                     ↓
                     CONCURRENCY-SAFE STOCK RESERVATION
             - Atomic increment of reservedQuantity
             - Rolls back on conflict (Zero oversell)
                                     ↓
                     PAYPAL ORDER INITIALIZATION (v2)
             - Intent: CAPTURE
             - Fixed conversion (USD / INR)
                                     ↓
                       PATIENT APPROVES ON PAYPAL
                                     ↓
                    [POST /api/paypal/capture-order]
                                     ↓
                     SERVER-SIDE CAPTURE VERIFICATION
             - Verifies payment status === 'COMPLETED'
             - Validates captured amount matches order
                                     ↓
                       ATOMIC COMMIT & CONFIRMATION
             - Transitions order status to ACCEPTED
             - stockCommitted: true, paymentStatus: 'PAID'
             - Tamper-evident clinical audit record logged
             - WebSocket events emitted to clinic & pharmacy
```

---

## 2. Environment Configuration & Secret Hygiene

### 2.1 Configuration Keys

| Parameter | Sandbox Value (Current) | Production Value (Required for Go-Live) | Sensitivity |
| :--- | :--- | :--- | :---: |
| `PAYPAL_CLIENT_ID` | `ATRP8z_3s62vyj...` | Live PayPal REST App Client ID | Public Metadata |
| `PAYPAL_CLIENT_SECRET` | Provisioned via Secret Store | Provisioned via AWS Secrets Manager | **CRITICAL SECRET** |
| `PAYPAL_ENVIRONMENT` | `sandbox` | `live` | Public Configuration |
| `PAYPAL_WEBHOOK_ID` | `sandbox_webhook_id` | Live Registered Webhook ID | **HIGH** |
| `PAYPAL_API_BASE` | `https://api-m.sandbox.paypal.com` | `https://api-m.paypal.com` | Internal |

### 2.2 Security & Hygiene Directives
1. **Zero Secret Leakage:** `PAYPAL_CLIENT_SECRET` must **NEVER** be committed to Git, bundled into Vite/React frontend assets, printed in API response payloads, stored in `localStorage`/`sessionStorage`, or emitted in log statements.
2. **Scrubbing:** The public endpoint `GET /api/paypal/config` strictly returns only `clientId`, `currency`, `environment`, and `isLive`. Secrets are completely stripped.
3. **Fail-Safe Startup:** `backend/utils/configValidator.js` halts server initialization if `APP_ENV=production` and `PAYPAL_ENVIRONMENT !== "live"` or if client secrets are missing.

---

## 3. Core API Endpoints & Operational Flows

### 3.1 Public Configuration Probe
- **Endpoint:** `GET /api/paypal/config`
- **Access:** Public (Used by frontend PayPal SDK wrapper)
- **Response Schema:**
```json
{
  "clientId": "ATRP8z_3s62vyjSTwB-2z0Mh1nXyqyZxxA5IK1bbGF6TUNAIWRch5KqMnnv59DcOpDa1oDaOius7nB35",
  "currency": "USD",
  "environment": "sandbox",
  "isLive": false
}
```

### 3.2 Authoritative Order Creation & Stock Reservation
- **Endpoint:** `POST /api/paypal/create-order`
- **Access:** Authenticated / Optional Patient Auth
- **Request Body:**
```json
{
  "items": [
    { "productId": "6a9ace96747d5ffd24348a5a", "quantity": 1 }
  ],
  "deliveryAddress": {
    "street": "12 Bandra West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400050"
  },
  "prescriptionRef": ""
}
```
- **Validation Pipeline:**
  1. Re-queries database product catalog for current unit price and tax rate.
  2. Computes Intrastate/Interstate GST breakdown.
  3. Executes `validateOrderPrescriptions()` for any Schedule H/H1 medications.
  4. Calls `reserveStock()`: atomically increments `reservedQuantity`.
  5. Interacts with PayPal v2 API to create order intent.
- **Response Schema:**
```json
{
  "success": true,
  "id": "PP-ORDER-1792257522821",
  "gatewayOrderId": "PP-ORDER-1792257522821",
  "computedTotalINR": 96,
  "computedTotalUSD": "1.20",
  "pricing": {
    "subtotal": 50,
    "taxableAmount": 50,
    "cgst": 3,
    "sgst": 3,
    "igst": 0,
    "totalTax": 6,
    "deliveryFee": 40,
    "grandTotal": 96,
    "currency": "INR"
  },
  "environment": "sandbox"
}
```

### 3.3 Capture Verification & Atomic Fulfillment
- **Endpoint:** `POST /api/paypal/capture-order`
- **Access:** Authenticated / Optional Patient Auth
- **Idempotency Defense:** Queries existing orders matching `paypalOrderId`, `paymentDetails.paymentId`, or `idempotencyKey`. If an existing order is found, returns existing record with `isDuplicate: true`.
- **Fulfillment Pipeline:**
  1. Verifies capture with PayPal v2 API.
  2. Calls `commitStock()`: moves inventory from `reservedQuantity` to `stockQuantity`.
  3. Creates `Order` with `paymentMethod: "paypal"`, `paymentStatus: "PAID"`, `status: "ACCEPTED"`.
  4. Records immutable entry in `ClinicalAudit`.
  5. Emits `ORDER_CREATED` and `PAYMENT_UPDATED` WebSocket events.

### 3.4 Cryptographic Webhook Handler
- **Endpoint:** `POST /api/paypal/webhook`
- **Access:** PayPal Ingress
- **Handled Event Types:**
  - `PAYMENT.CAPTURE.COMPLETED`: Idempotently updates order payment state to `PAID`.
  - `PAYMENT.CAPTURE.DENIED`: Marks order `CANCELLED`, payment `FAILED`, and calls `releaseStock()`.
  - `PAYMENT.CAPTURE.REFUNDED`: Marks order `REJECTED`, payment `REFUNDED`, and calls `releaseStock()`.
- **Replay Protection:** In-memory and persistent `PaymentService.isEventProcessed(eventId)` deduplication suppresses duplicate actions and returns `{ status: "ok", duplicate: true }`.

### 3.5 Bounds-Checked Refunds
- **Endpoint:** `POST /api/paypal/refund`
- **Access:** Authenticated (`admin`, `pharmacy`)
- **Safety Invariants:**
  1. `requestedRefund <= order.totalAmount` (Over-refunding rejected with HTTP 400).
  2. Order must be in `PAID` state. Already refunded orders return idempotent `{ isDuplicate: true }`.
  3. Transitions order status to `REJECTED` and payment status to `REFUNDED`.
  4. Automatically triggers `releaseStock()` to return non-dispensed inventory.

---

## 4. Payment Reconciliation Engine

### 4.1 Inconsistency Detection
The background service `ReconciliationService` scans for payment telemetry discrepancies:
- **Scenario A (Captured but Pending):** Patient browser disconnected before capture callback. Reconciler synchronizes with PayPal API, commits stock, transitions order to `PAID`, and advances fulfillment to `ACCEPTED`.
- **Scenario B (Abandoned Cart / Expired Checkout):** Order older than 30 minutes in `PENDING` status with reserved stock. Reconciler marks order `FAILED`, releases reserved stock, and logs audit record.
- **Scenario C (Amount Mismatch):** Captured amount does not equal server-authoritative grand total. Flags order `RECONCILIATION_FLAGGED` and halts fulfillment.

### 4.2 Manual & Scheduled Batch Reconcile
- **Endpoint:** `POST /api/payment/reconcile`
- **Access:** Authenticated (`admin`, `pharmacy`)
- **Payload:** `{ "olderThanMinutes": 15 }`
- **Operational Execution:**
```bash
curl -X POST http://localhost:5001/api/payment/reconcile \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"olderThanMinutes": 15}'
```

---

## 5. Emergency Incident Procedures (Payment Failures)

### Incident 1: PayPal Webhook Failure / Backlog
- **Symptoms:** Orders created on PayPal but showing `PENDING` on TriMedi pharmacy dashboard.
- **Action:**
  1. Trigger manual batch reconciliation: `POST /api/payment/reconcile` with `olderThanMinutes: 0`.
  2. Inspect PayPal Developer Dashboard -> Webhook Events for HTTP 5xx failures.
  3. Verify reverse proxy allows PayPal webhook traffic and does not throttle via rate limiting.

### Incident 2: Double Capture or Replay Attack
- **Symptoms:** High-frequency duplicate capture requests for same `paypalOrderId`.
- **Mitigation:**
  - Automated idempotency guard in `capture-order` returns existing confirmed order without re-committing stock.
  - Review security events on `/api/privacy/threat-events`.

### Incident 3: Erroneous / Unauthorized Refund
- **Symptoms:** Unexpected refund recorded on paid order.
- **Mitigation:**
  - Check `ClinicalAudit` logs for `actor.email` and `actor.role`.
  - Verify inventory was released correctly; adjust stock manually via `PATCH /api/products/:id/stock` if items were already physically dispensed.
