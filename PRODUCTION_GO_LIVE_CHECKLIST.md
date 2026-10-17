# TriMedi Production Go-Live Checklist (Phase 5.9)

**Platform:** TriMedi Intelligent Healthcare Ecosystem  
**Milestone:** Phase 5.9 — Production Gate & Go-Live Readiness  
**Target Architecture:** Production Cloud Cluster (Node.js + MongoDB Replica Set + Redis + Razorpay + Gemini AI)  
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
| MongoDB Credentials      | LOCAL SCRUBBED        | MANUAL ROTATION REQ.   | BLOCKED (Cloud Gate)   |
| Database Engine          | REPLICA-READY (503)   | CONFIG VERIFIED        | READY                  |
| Redis Distributed Store  | ARCHITECTURE READY    | MULTI-INSTANCE GATED   | READY (Single) / BLK*  |
| Authentication & RBAC    | VERIFIED (5 Roles)    | LEAST-PRIVILEGE AUDIT  | READY                  |
| Clinical Safety & AI     | 100% HUMAN-IN-LOOP    | ZERO AUTO-PRESCRIBING  | READY                  |
| Commerce & GST           | SERVER-AUTHORITATIVE  | HSN 3004 12% GST       | READY                  |
| Payments Gateway         | CRYPTO HMAC ACTIVE    | LIVE KYC PENDING       | BLOCKED (Gateway Gate) |
| Backup & Disaster Rec.   | RTO/RPO VALIDATED     | RUNBOOK EXECUTABLE     | READY                  |
| Observability Probes     | /live, /ready, /health| ZERO SECRET LEAKAGE    | READY                  |
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
- [x] **Fail-Safe HTTP 503 Guard:** Any write or read during database unavailability fails safe with `DATABASE_UNAVAILABLE` (HTTP 503). Zero silent fallback to volatile in-memory storage.
- [x] **CORS Configuration:** Production origins strictly whitelisted to official customer and clinical portals. Wildcards unconditionally blocked.
- [x] **Security HTTP Headers:** Production responses deliver `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (HSTS), and `Referrer-Policy`.

---

## 3. Database & Secret Hygiene

- [x] **Repository Tracked Secret Scrub:** Active Git index verified 100% free of plaintext database URIs, passwords, and private tokens.
- [x] **Frontend Bundle Sanitization:** Production Vite client bundle (`dist/assets/*.js`) audited for zero backend credentials, MongoDB strings, or API secrets.
- [x] **Telemetry Probe Scrubbing:** Diagnostic endpoint `/health` audited; components report sanitized uptime and connection states without credential exposure.
- [x] **Legacy Compromised User Protection:** `configValidator.js` intercepts and halts server startup if legacy Atlas user `adityanikams73_db_user` is supplied.
- [ ] **Atlas Cloud Console User Deletion:** Permanent deletion of legacy user `adityanikams73_db_user` and password rotation in MongoDB Atlas Cloud Console.  
  *Status:* **`MANUAL ACTION REQUIRED — NOT AUTOMATICALLY VERIFIED` (BLOCKER 1)**
- [ ] **Provision Rotated Production Atlas Credentials:** Provision least-privilege Atlas user (`trimedi_prod_app`) with readWrite on `trimedi_production` database only.  
  *Status:* **`MANUAL ACTION REQUIRED — PENDING DEPLOYMENT`**

---

## 4. Distributed Security & Session State

- [x] **SecurityStore Abstraction:** Multi-adapter architecture (`MemorySecurityAdapter` for single-instance, `RedisSecurityAdapter` for distributed).
- [x] **Single-Instance Safety Gate:** When running without Redis, `securityStore.getStatus()` outputs `SINGLE_INSTANCE_ONLY` and blocks multi-replica deployment.
- [x] **Cryptographic Token Revocation:** Ephemeral blacklist invalidates JWT sessions immediately on `/api/auth/logout`.
- [x] **Cross-Device Invalidation:** Password reset or update invalidates existing sessions across all user devices.
- [x] **Sliding-Window Rate Limiting:** Brute-force throttling on `/api/auth/*` and `/api/payment/*` endpoints.
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

## 6. Commerce, Taxation & Payment Verification

- [x] **Server-Authoritative Pricing Engine:** Client-supplied prices, tax calculations, and grand totals are completely ignored. All values recalculated from the server database catalog.
- [x] **GST Statutory Compliance:** Authoritative taxation engine calculates Intrastate (CGST 6% + SGST 6%) and Interstate (IGST 12%) breakdown on HSN Chapter 30 medicaments.
- [x] **Atomic Inventory Reservation:** Multi-stage concurrency control (`reserveStock` -> `commitStock` -> `releaseStock`) eliminates overselling and prevents negative stock.
- [x] **10-Stage Fulfillment State Machine:** Strict transitions (`NEW` -> `PRESCRIPTION_REVIEW` -> `ACCEPTED` -> `PREPARING` -> `PACKED` -> `DISPATCHED` -> `OUT_FOR_DELIVERY` -> `DELIVERED` -> `COMPLETED`).
- [x] **Cryptographic Webhook Verification:** HMAC SHA-256 signature verification over incoming raw body buffer with constant-time equality check.
- [x] **Duplicate Webhook Idempotency:** In-memory and database-backed event deduplication prevents duplicate order fulfillment on webhook replay.
- [ ] **Razorpay Live Merchant Account Activation:** Complete business KYC, link live bank settlement account, and generate live keys (`rzp_live_...`).  
  *Status:* **`EXTERNAL PREREQUISITE — PENDING GATEWAY APPROVAL` (BLOCKER 2)**

---

## 7. Disaster Recovery & Observability

- [x] **9-Entity Backup Coverage:** Schema captures Users, Appointments, Consultations, Prescriptions, Medications, Orders, Payments, Inventory, and Audit Logs.
- [x] **Staging Recovery Drill:** Verified 100% SHA-256 checksum integrity and 0 broken foreign key relationships.
- [x] **Target Recovery Metrics:** Recovery Point Objective (RPO) demonstrated at $0\text{s}$ (Target $< 1\text{ hr}$); Recovery Time Objective (RTO) demonstrated at $0.01\text{s}$ staging (Target $< 15\text{ min}$).
- [x] **Container Probes:** `/live` reflects process uptime; `/ready` asserts database connection readiness; `/health` provides sanitized telemetry.
- [ ] **Live Atlas Snapshot Automation:** Schedule automated 6-hour snapshot policies with 30-day retention in MongoDB Atlas.  
  *Status:* **`MANUAL ACTION REQUIRED — PENDING INFRASTRUCTURE DEPLOYMENT`**

---

## 8. Statutory Governance & Legal Compliance

- [x] **Patient Consent Management:** Versioned clinical consent tracking with immutable timestamping.
- [x] **Mandatory-Care Revocation Guard:** Critical clinical care consent locked against improper revocation.
- [x] **Sovereign Data Portability:** Machine-readable clinical record export (`JSON_STANDARDIZED_HEALTH_RECORD`) under DPDP Act 2023 Section 6.
- [ ] **Telemedicine Practice Guidelines (2020) Sign-Off:** Formal legal sign-off on digital prescription validity and doctor verification requirements.  
  *Status:* **`LEGAL REVIEW REQUIRED` (BLOCKER 3)**
- [ ] **Drugs and Cosmetics Act Compliance Sign-Off:** Formal regulatory sign-off on Schedule H and H1 digital dispensing workflow.  
  *Status:* **`LEGAL REVIEW REQUIRED` (BLOCKER 3)**
- [ ] **DPDP Act 2023 Compliance Sign-Off:** Data Protection Officer (DPO) and healthcare privacy counsel sign-off on data retention and processing agreements.  
  *Status:* **`LEGAL REVIEW REQUIRED` (BLOCKER 3)**

---

## 9. Final Pre-Flight Gate Determination

| Gate Element | Result | Action Required |
| :--- | :---: | :--- |
| **Automated Test Regression (206/206)** | **PASS** | None — Zero regressions across all phases |
| **Frontend Production Build (Vite)** | **PASS** | None — Zero errors, 1.15s compile time |
| **Full 22-Step Production Smoke Test** | **PASS** | None — 100% workflow success |
| **MongoDB Atlas Live Rotation** | **BLOCKED** | Manual deletion of `adityanikams73_db_user` in Atlas |
| **Razorpay Live Merchant KYC** | **BLOCKED** | External approval and live key issuance |
| **Statutory Legal Sign-Off** | **BLOCKED** | Retain legal counsel for Telemedicine & DPDP review |

### Disposition
**NO-GO — PRODUCTION BLOCKED** pending the completion and formal sign-off of the three manual external gates documented above.
