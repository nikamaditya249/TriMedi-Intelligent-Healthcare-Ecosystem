# TriMedi Production Go-Live Checklist (Phase 5.95)

**Platform:** TriMedi Intelligent Healthcare Ecosystem  
**Milestone:** Phase 5.95 — Final Production Blocker Clearance & Go-Live Verification  
**Target Architecture:** Production Cloud Cluster (Node.js + MongoDB Atlas Cluster0 + Redis + PayPal v2 Live + Gemini AI)  
**Date:** October 17, 2026  

---

## 1. Pre-Flight Production Gate Overview

The TriMedi platform requires unconditional verification across all technical, clinical, security, and statutory dimensions prior to general public traffic cutover.

```
+----------------------------------------------------------------------------------------------------+
|                                    TRIMEDI GO-LIVE GATE MATRIX                                     |
+--------------------------+-----------------------+------------------------+------------------------+
| Dimension                | Technical Status      | Governance Status      | Go-Live Disposition    |
+--------------------------+-----------------------+------------------------+------------------------+
| Environment Separation   | VERIFIED (4 Tiers)    | COMPLIANT              | READY                  |
| MongoDB Cluster Health   | AVAILABLE / RUNNING   | PROBED & PINGED (563ms)| GREEN                  |
| MongoDB Credential Sec.  | LOCAL SCRUBBED        | MANUAL ROTATION REQ.   | BLOCKED (Cloud Gate)   |
| Database Engine Fail-Safe| REPLICA-READY (503)   | ZERO VOLATILE CLINICAL | GREEN                  |
| Redis Distributed Store  | ARCHITECTURE READY    | MULTI-INSTANCE GATED   | READY (Single) / BLK*  |
| Authentication & RBAC    | VERIFIED (5 Roles)    | LEAST-PRIVILEGE AUDIT  | GREEN                  |
| Clinical Safety & AI     | 100% HUMAN-IN-LOOP    | ZERO AUTO-PRESCRIBING  | GREEN                  |
| Commerce & GST           | SERVER-AUTHORITATIVE  | HSN 3004 12% GST       | GREEN                  |
| Payments Gateway (PayPal)| 16/16 VERIFIED        | LIVE KEYS REQUIRED     | BLOCKED (Live Keys)    |
| Backup & Disaster Rec.   | RTO/RPO VALIDATED     | RUNBOOK EXECUTABLE     | GREEN                  |
| Observability Probes     | /live, /ready, /health| ZERO SECRET LEAKAGE    | GREEN                  |
| Statutory Legal Review   | POLICIES DRAFTED      | SIGN-OFF REQUIRED      | BLOCKED (Legal Gate)   |
+--------------------------+-----------------------+------------------------+------------------------+
* Single-instance container pilot is ready; multi-replica horizontally scaled cluster requires Redis deployment.
```

---

## 2. Infrastructure & Environment Readiness

- [x] **Discrete Runtime Environments:** Environment configurations isolated into `development`, `staging`, `pilot`, and `production`.
- [x] **Startup Configuration Validator:** `backend/utils/configValidator.js` validates environment parameters and halts startup on fatal errors.
- [x] **Production Secret Externalization:** Production secrets prohibited in codebase; loaded via environment variables / secret manager (AWS Secrets Manager or Doppler).
- [x] **Mock Database Lockdown:** `isMockAllowed()` in `backend/middleware/dbGuard.js` unconditionally returns `false` when `APP_ENV=production`.
- [x] **Fail-Safe HTTP 503 Guard:** Any write or read during database unavailability fails safe with `DATABASE_UNAVAILABLE` (HTTP 503). Zero silent fallback to volatile in-memory storage for clinical/financial records.
- [x] **CORS Configuration:** Production origins strictly whitelisted to official customer and clinical portals. Wildcards unconditionally blocked.
- [x] **Security HTTP Headers:** Production responses deliver `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (HSTS), and `Referrer-Policy`.

---

## 3. Database & Secret Hygiene

- [x] **Atlas Cluster Running & Available:** MongoDB Atlas Cluster0 verified running, reachable, pinged in 563ms, with 9 collections and 72 products actively queried.
- [x] **Repository Tracked Secret Scrub:** Active Git index verified 100% free of plaintext database URIs, passwords, and private tokens.
- [x] **Frontend Bundle Sanitization:** Production Vite client bundle (`dist/assets/*.js`) audited for zero backend credentials, MongoDB strings, or API secrets.
- [x] **Telemetry Probe Scrubbing:** Diagnostic endpoint `/health` audited; components report sanitized uptime and connection states without credential exposure.
- [x] **Legacy Compromised User Protection:** `configValidator.js` intercepts and halts server startup if legacy Atlas user `adityanikams73_db_user` is supplied in production mode.
- [ ] **Atlas Cloud Console User Deletion:** Permanent deletion of legacy user `adityanikams73_db_user` and password rotation in MongoDB Atlas Cloud Console (`cloud.mongodb.com`).  
  *Status:* **`MANUAL ACTION REQUIRED — NOT AUTOMATICALLY VERIFIED` (BLOCKER 1 - P0)**
- [ ] **Provision Rotated Production Atlas Credentials:** Provision least-privilege Atlas user (`trimedi_prod_app`) with readWrite on `trimedi` database only.  
  *Status:* **`MANUAL ACTION REQUIRED — PENDING DEPLOYMENT`**

---

## 4. Distributed Security & Session State

- [x] **SecurityStore Abstraction:** Multi-adapter architecture (`MemorySecurityAdapter` for single-instance, `RedisSecurityAdapter` for distributed).
- [x] **Single-Instance Safety Gate:** When running without Redis, `securityStore.getStatus()` outputs `SINGLE_INSTANCE_ONLY` and blocks multi-replica deployment.
- [x] **Cryptographic Token Revocation:** Ephemeral blacklist invalidates JWT sessions immediately on `/api/auth/logout`.
- [x] **Cross-Device Invalidation:** Password reset or update records user invalidation timestamp; terminates existing sessions across all user devices.
- [x] **Sliding-Window Rate Limiting:** Brute-force throttling on `/api/auth/*` and `/api/paypal/*` endpoints.
- [ ] **External Redis Production Cluster:** Deploy dedicated Redis cluster (ElastiCache or Redis Enterprise with TLS & auth) for horizontal multi-container scaling.  
  *Status:* **`OPTIONAL FOR SINGLE CONTAINER / MANDATORY FOR MULTI-CONTAINER CLUSTER`**

---

## 5. Clinical Safety & Human-in-the-Loop Governance

- [x] **Zero Autonomous AI Prescribing:** AI extraction engine produces structured drafts with field-level confidence scores ($0.0\text{–}1.0$).
- [x] **Strict DRAFT Initialization:** All AI-extracted prescriptions initialized with status `draft / DRAFT_PENDING_REVIEW`.
- [x] **Physician Clinical Signature Gate:** Prescriptions transition to `active` only upon explicit cryptographic verification and approval by a licensed doctor.
- [x] **Clinical Role Least Privilege:** Receptionists and retail pharmacists strictly blocked from inspecting private doctor consultation notes and clinical psychiatric diagnoses (`HTTP 403 Forbidden`).
- [x] **IDOR Cross-Patient Defense:** Patients strictly prohibited from viewing or modifying prescriptions, appointments, or medical records of other patients (`HTTP 403 Forbidden`).
- [x] **Break-Glass Emergency Protocol:** Emergency access restricted to licensed physicians; mandatory clinical justification enforced and logged to tamper-evident audit journal.

---

## 6. Commerce, Taxation & PayPal Payment Verification

- [x] **Server-Authoritative Pricing Engine:** Client-supplied prices, tax calculations, and grand totals are completely ignored. All values recalculated from the server database catalog.
- [x] **GST Statutory Compliance:** Authoritative taxation engine calculates Intrastate (CGST 6% + SGST 6%) and Interstate (IGST 12%) breakdown on HSN Chapter 30 medicaments.
- [x] **Atomic Inventory Reservation:** Multi-stage concurrency control (`reserveStock` -> `commitStock` -> `releaseStock`) eliminates overselling and prevents negative stock.
- [x] **10-Stage Fulfillment State Machine:** Strict transitions (`NEW` -> `PRESCRIPTION_REVIEW` -> `ACCEPTED` -> `PREPARING` -> `PACKED` -> `DISPATCHED` -> `OUT_FOR_DELIVERY` -> `DELIVERED` -> `COMPLETED`).
- [x] **PayPal v2 Order Integration:** Code-verified and sandbox-verified order creation, capture, and verification (`backend/routes/paypal.js`).
- [x] **Cryptographic Webhook Processing:** Handled `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, and `PAYMENT.CAPTURE.REFUNDED` with duplicate replay defense.
- [x] **Bounds-Checked Refunds:** Order refund amounts validated against order total with automatic inventory release and idempotent retry handling.
- [ ] **PayPal Live Production Credentials:** Supply live credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT=live`) and register production webhook ID.  
  *Status:* **`PROVISIONING REQUIRED FOR GO-LIVE` (BLOCKER 2 - P1)**

---

## 7. Disaster Recovery & Observability

- [x] **9-Entity Backup Coverage:** Schema captures Users, Appointments, Consultations, Prescriptions, Medications, Orders, Payments, Inventory, and Audit Logs.
- [x] **Staging Recovery Drill:** Verified 100% SHA-256 checksum integrity and 0 broken foreign key relationships.
- [x] **Target Recovery Metrics:** Recovery Point Objective (RPO) demonstrated at $0\text{s}$ (Target $< 1\text{ hr}$); Recovery Time Objective (RTO) demonstrated at $0.01\text{s}$ staging (Target $< 15\text{ min}$).
- [x] **Container Probes:** `/live` reflects process uptime (HTTP 200); `/ready` asserts database connection readiness (HTTP 200); `/health` provides sanitized telemetry without secret exposure.
- [ ] **Live Atlas Snapshot Automation:** Schedule automated 6-hour snapshot policies with 30-day retention in MongoDB Atlas.  
  *Status:* **`MANUAL ACTION REQUIRED — PENDING INFRASTRUCTURE DEPLOYMENT`**

---

## 8. Statutory Governance & Legal Compliance

- [x] **Patient Consent Management:** Versioned clinical consent tracking with immutable timestamping.
- [x] **Mandatory-Care Revocation Guard:** Critical clinical care consent locked against improper revocation.
- [x] **Sovereign Data Portability:** Machine-readable clinical record export (`JSON_STANDARDIZED_HEALTH_RECORD`) under DPDP Act 2023 Section 6.
- [ ] **Telemedicine Practice Guidelines (2020) Sign-Off:** Formal legal sign-off on digital prescription validity and doctor verification requirements.  
  *Status:* **`LEGAL REVIEW REQUIRED` (BLOCKER 3 - P0)**
- [ ] **Drugs and Cosmetics Act Compliance Sign-Off:** Formal regulatory sign-off on Schedule H and H1 digital dispensing workflow.  
  *Status:* **`LEGAL REVIEW REQUIRED` (BLOCKER 3 - P0)**
- [ ] **DPDP Act 2023 Compliance Sign-Off:** Data Protection Officer (DPO) and healthcare privacy counsel sign-off on data retention and processing agreements.  
  *Status:* **`LEGAL REVIEW REQUIRED` (BLOCKER 3 - P0)**

---

## 9. Final Pre-Flight Gate Determination

| Gate Element | Result | Action Required |
| :--- | :---: | :--- |
| **Automated Test Regression (222/222)** | **PASS** | None — Zero regressions across all phases (206 baseline + 16 PayPal) |
| **Frontend Production Build (Vite)** | **PASS** | None — Zero errors, 1.24s compile time |
| **Full 22-Step Production Smoke Test** | **PASS** | None — 100% workflow success with PayPal capture verification |
| **MongoDB Atlas Cluster Running** | **PASS** | None — Atlas Cluster0 probed and verified live (563ms) |
| **MongoDB Atlas Credential Security**| **BLOCKED** | Manual deletion of `adityanikams73_db_user` in Atlas Cloud Console |
| **PayPal Live Production Gateway** | **BLOCKED** | Provision live client ID and secret (`PAYPAL_ENVIRONMENT=live`) |
| **Statutory Legal Sign-Off** | **BLOCKED** | Retain legal counsel for Telemedicine, Pharmacy & DPDP Act sign-off |

### Disposition
**NO-GO — PRODUCTION BLOCKED** pending the completion and formal sign-off of the remaining P0 blockers (Atlas credential rotation in cloud console and statutory legal review).
