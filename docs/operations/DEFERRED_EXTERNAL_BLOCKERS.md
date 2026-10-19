# TriMedi Intelligent Healthcare Ecosystem
## Deferred External Production Blockers & Remediation Register

**Document Reference:** `docs/operations/DEFERRED_EXTERNAL_BLOCKERS.md`  
**Classification:** Production Release Gate & External Governance  
**Status:** Authoritative Blocker Register (4 Items Gated)  

---

### 1. Executive Summary & Release Policy

The TriMedi technical core is **100% verified and operational** across 366 regression points and 22 end-to-end clinical smoke steps. However, in accordance with the **Absolute Anti-Fabrication Mandate**, public production launch is strictly **BLOCKED** pending the resolution of four external real-world dependencies.

```
============================================================
GO-LIVE RELEASE GATE STATUS
============================================================
Technical Implementation:    PASS (100% Verified)
Automated Regression:        PASS (366 / 366 Points)
Production Smoke Test:       PASS (22 / 22 Steps)
Public Production Decision:  NO-GO — PRODUCTION BLOCKED
Reason:                      4 External Blockers Deferred
============================================================
```

---

### 2. The Four Deferred External Blockers

```
┌────────────────────────────────────────────────────────┐
│               FOUR DEFERRED EXTERNAL BLOCKERS          │
├────────────────────────────────────────────────────────┤
│ 1. Legacy Atlas User Cloud Deletion   [ P0 - DEFERRED ]│
│ 2. Formal Legal / Compliance Sign-Off [ P0 - DEFERRED ]│
│ 3. PayPal Live Merchant Activation    [ P1 - DEFERRED ]│
│ 4. PayPal Live Webhook Registration   [ P1 - DEFERRED ]│
└────────────────────────────────────────────────────────┘
```

---

### Blocker 1: Legacy MongoDB User Deletion Verification
- **Identifier:** `BLOCKER-EXT-01`
- **Severity:** **P0 (Critical Security)**
- **Current Status:** **DEFERRED / NOT EXTERNALLY VERIFIED**
- **Why It Is External:**
  The compromised legacy user `adityanikams73_db_user` was historically exposed in git commits. Programmatic code can only verify that local configuration files and application code do not reference the user; actual physical deletion of the database user requires administrative privileges in the MongoDB Atlas cloud management console (`cloud.mongodb.com`).
- **Required Manual Action:**
  1. Organization DBA logs into `cloud.mongodb.com`.
  2. Select the TriMedi project > **Security** > **Database Access**.
  3. Locate `adityanikams73_db_user`.
  4. Click the delete (trash) icon and confirm deletion.
  5. Confirm that dedicated production user `trimedi_prod` remains active with `readWrite` on database `trimedi`.
- **Evidence Required:**
  A screenshot of the Atlas **Database Access** dashboard showing that `adityanikams73_db_user` is absent and `trimedi_prod` is present, accompanied by the Atlas Activity / Audit log entry of the deletion.
- **Impact on Production Launch:**
  Without physical cloud deletion, the compromised credential remains a latent vector for unauthorized database queries if cluster network whitelisting is compromised.

---

### Blocker 2: Formal Legal / Privacy Counsel Sign-Off
- **Identifier:** `BLOCKER-EXT-02`
- **Severity:** **P0 (Regulatory & Statutory)**
- **Current Status:** **DEFERRED / NOT EXTERNALLY VERIFIED**
- **Why It Is External:**
  Compliance with the Telemedicine Practice Guidelines (2020), Digital Personal Data Protection (DPDP) Act (2023), Drugs and Cosmetics Act (1940), and Pharmacy Act (1948) cannot be legally executed or certified by software developers or autonomous AI agents. Only licensed attorneys or qualified Data Protection Officers (DPO) have the statutory authority to execute legal certifications.
- **Required Manual Action:**
  1. Retain licensed healthcare and data privacy legal counsel admitted to practice in the deployment jurisdiction.
  2. Provide counsel with the TriMedi technical governance pack (`docs/compliance/LEGAL_REVIEW_CHECKLIST.md`, `docs/compliance/PRIVACY_POLICY.md`, `docs/compliance/TERMS_OF_SERVICE.md`, `docs/ai/MEDICAL_AI_DISCLAIMER.md`).
  3. Execute formal review across the 17 statutory compliance domains.
- **Evidence Required:**
  At least one formal external artifact:
  - Formally signed legal counsel approval letter / opinion
  - Signed healthcare/privacy compliance opinion
  - Formally executed DPO compliance certificate explicitly naming **TriMedi** and confirming statutory compliance.
- **Impact on Production Launch:**
  Operating a digital healthcare and telemedicine platform without formal legal sign-off exposes the operating entity to regulatory penalties under the DPDP Act and potential revocation of physician telemedicine licenses.

---

### Blocker 3: PayPal Live Merchant Activation
- **Identifier:** `BLOCKER-EXT-03`
- **Severity:** **P1 (Commercial Operations)**
- **Current Status:** **DEFERRED / NOT EXTERNALLY VERIFIED**
- **Payment Provider Scope:** PayPal REST API v2 is the **SOLE** required online payment provider. Razorpay is excluded and is NOT a blocker.
- **Why It Is External:**
  While the technical gateway integration is 100% verified (server pricing, GST, inventory atomic reservation, capture, bounded refund, reconciliation), live financial transactions require commercial merchant KYC onboarding and live REST API credentials from PayPal.
- **Required Manual Action:**
  1. Corporate finance team completes business merchant KYC on the PayPal Business Portal (`paypal.com`).
  2. Log into the PayPal Developer Dashboard (`developer.paypal.com`) and switch toggle to **Live**.
  3. Create production REST API application named `TriMedi Production Gateway`.
  4. Inject `PAYPAL_ENVIRONMENT=live`, `PAYPAL_CLIENT_ID`, and `PAYPAL_CLIENT_SECRET` into the secure server environment variables.
  5. Execute a minimal controlled live transaction ($1.00 USD / nominal INR) using a non-clinical test account.
- **Evidence Required:**
  - PayPal Business merchant KYC approval confirmation.
  - Live Developer Dashboard screenshot.
  - Redacted PayPal capture ID confirming live settlement.
- **Impact on Production Launch:**
  Without live credentials, the platform cannot accept real online payments from patients for prescription fulfillment.

---

### Blocker 4: PayPal Live Webhook Registration
- **Identifier:** `BLOCKER-EXT-04`
- **Severity:** **P1 (Fulfillment Operations)**
- **Current Status:** **DEFERRED / NOT EXTERNALLY VERIFIED**
- **Authoritative Endpoint:** `https://api.trimedi.health/api/paypal/webhook`
- **Why It Is External:**
  Live asynchronous webhook notifications (`PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`) require production public DNS and TLS termination, along with manual webhook registration in the PayPal Live Developer Dashboard.
- **Required Manual Action:**
  1. Complete public DNS cutover and verify TLS certificate for `api.trimedi.health`.
  2. In the PayPal Developer Dashboard (Live App), click **Add Webhook**.
  3. Enter the authoritative URL: `https://api.trimedi.health/api/paypal/webhook`.
  4. Subscribe to capture, denial, and refund event notifications.
  5. Trigger a live test event from the dashboard.
- **Evidence Required:**
  - Screenshot of the Live Developer Dashboard showing the registered webhook URL and subscribed events.
  - Server access log showing HTTP 200 response to the PayPal test event.
- **Impact on Production Launch:**
  Without live webhook delivery, asynchronous order state synchronization (e.g. out-of-band capture completion or chargebacks) will rely solely on scheduled batch polling.

---

### 3. Path to Final Go-Live Certification

When all four external items are completed and direct documentary evidence is archived in the repository compliance registry, the release gate can be certified:

```
P0 COUNT: 0
P1 COUNT: 0
FINAL DECISION: GO — PRODUCTION READY
```

Until that point, the system operates in **Controlled Pilot Mode** only.
