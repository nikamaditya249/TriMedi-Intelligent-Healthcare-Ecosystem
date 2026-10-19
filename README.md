# TriMedi — Intelligent Healthcare Ecosystem

> **An integrated, asynchronous healthcare operating system connecting patients, registered medical practitioners, clinic queues, and verified retail pharmacies with assistive clinical intelligence, tamper-evident audit trails, and server-authoritative commerce.**

---

## 1. Project Title
**TriMedi Intelligent Healthcare Ecosystem**

---

## 2. One-Line Project Description
A unified, real-time healthcare platform providing end-to-end clinical workflow automation, AI-assisted prescription transcription, doctor-supervised e-pharmacy dispensing, and longitudinal medication adherence tracking.

---

## 3. The Healthcare Problem
Traditional healthcare delivery in outpatient and ambulatory settings suffers from severe operational fragmentation:
- **Clinical Data Silos:** Patient medical records, appointment schedules, and pharmacy dispensing records exist in disconnected databases, leading to adverse drug interactions and lost medical histories.
- **Queue Inefficiencies:** Long physical clinic wait times without real-time triage or queue transparency distress patients and overload clinic receptionists.
- **Prescription Transcription Errors:** Illegible handwritten prescriptions contribute significantly to preventable outpatient medication errors.
- **Medication Non-Adherence:** Over 50% of chronic patients fail to follow prescribed medication regimens, resulting in preventable hospital readmissions.
- **Uncontrolled E-Pharmacy Dispensing:** Online pharmacy platforms frequently lack strict clinical verification, facilitating illegal distribution of Schedule H/X prescription drugs without valid physician sign-off.

---

## 4. The TriMedi Solution
TriMedi bridges outpatient clinical encounters with downstream pharmaceutical fulfillment within a single, secure, role-governed platform:
- **Unbroken Clinical Continuum:** Seamlessly transitions patients from appointment booking to live reception check-in, physician consultation, AI-assisted prescription authoring, digital pharmacy dispensing, and home dose adherence.
- **Assistive AI with Clinical Non-Delegation:** AI transcribes and structures prescription images but is strictly forced to `draft` status, requiring licensed physician review and cryptographic digital approval.
- **Closed-Loop E-Pharmacy:** Prescription drugs cannot be ordered or dispensed without an active, doctor-signed electronic prescription.
- **Longitudinal Medication Adherence:** Automatically tracks daily dose logs, calculates adherence percentages, predicts refill depletion dates, and alerts patients before medications run out.

---

## 5. Core Workflow (The 22-Step Care Continuum)

```
[ Patient Signs Up / Logs In ]
             │
             ▼
[ Books Telehealth or In-Clinic Appointment ]
             │
             ▼
[ Arrives at Clinic ──> Reception Checks In ──> Assigned Live Queue Token ]
             │
             ▼
[ Doctor Initiates Encounter ──> Records Vitals, SOAP Notes, Diagnosis ]
             │
             ▼
[ AI Assistive OCR Transcribes Rx ──> Strictly Forced to "draft" ]
             │
             ▼
[ Doctor Reviews Contraindications ──> Digitally Signs & Approves Rx ("active") ]
             │
             ▼
[ System Generates Medication Regimen & Daily Dosing Schedule ]
             │
             ▼
[ Pharmacy Verifies Rx Authenticity Under Least-Privilege Role ]
             │
             ▼
[ Patient Carts Prescribed Medicines ──> Server Calculates Price & GST ]
             │
             ▼
[ PayPal Online Payment ──> Atomic Stock Reservation & Capture Commit ]
             │
             ▼
[ Pharmacy Advances Fulfillment: ACCEPTED ──> PREPARING ──> PACKED ──> DISPATCHED ]
             │
             ▼
[ Delivery Complete ──> Patient Logs Dose ──> Refill Prediction Engine Signals Re-order ]
```

---

## 6. Major Features
- **Smart Clinic Queuing:** Real-time queue telemetry powered by Socket.IO with dynamic waiting time estimation.
- **Assistive Clinical OCR:** AI-assisted extraction of physical prescriptions with dosage safety bounds checking.
- **Doctor Digital Signature:** Registered Medical Practitioner (RMP) cryptographic signature stamping.
- **Sovereign Health Records:** Longitudinal patient consultation timelines with DPDP Act (2023) compliant JSON data export.
- **Server-Authoritative Pricing:** Catalog price enforcement with dual-tax GST calculations (CGST/SGST/IGST).
- **Concurrency-Safe Inventory:** Multi-document ACID inventory locks guaranteeing zero stock overselling.
- **Tamper-Evident Auditing:** SHA-256 chained transaction logging for clinical, financial, and security events.
- **Self-Healing Telemetry:** Probes (`/live`, `/ready`, `/health`) with automatic 503 `DATABASE_UNAVAILABLE` fail-safe circuit breaker.

---

## 7. User Roles & Least-Privilege Matrix

| Role | Core Capabilities | Clinical Privacy Boundaries |
|---|---|---|
| **Patient** | Appointments, medical history, dose tracking, medicine ordering | Shielded from other patients' records (IDOR defenses) |
| **Doctor (RMP)** | Consultations, vitals, AI Rx review, digital signing, contraindications | Restricted to authorized clinical encounters |
| **Receptionist** | Token allocation, check-ins, queue management | **Strictly blocked** from clinical notes, diagnoses, and prescriptions |
| **Pharmacist** | Prescription verification, order packing, dispatch, stock management | **Strictly blocked** from private clinical consultation notes |
| **Administrator** | System telemetry, audit inspection, physician verification | **Cannot** alter or forge clinical encounter records |

---

## 8. Architecture Overview

TriMedi follows an asynchronous, 3-tier micro-modular architecture:

```
┌────────────────────────────────────────────────────────┐
│                   Frontend Tier (SPA)                  │
│       React 18 + Vite + Tailwind/Modern Glassmorphism  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼────────────────────────────┐
│                    API Gateway Tier                    │
│      Node.js + Express + Socket.IO + configValidator   │
└─────────────┬─────────────┬─────────────┬──────────────┘
              │             │             │
┌─────────────▼───┐ ┌───────▼───┐ ┌───────▼──────────────┐
│Clinical Engine  │ │AI Engine  │ │Commerce & Payments   │
│Consultations,   │ │Gemini OCR │ │PayPal REST API v2    │
│Appointments, Rx │ │Assistive  │ │GST & ACID Inventory  │
└─────────────┬───┘ └───────┬───┘ └───────┬──────────────┘
              │             │             │
┌─────────────▼─────────────▼─────────────▼──────────────┐
│                      Data Stores                       │
│ - Primary Database: MongoDB Atlas (15 Collections)    │
│ - Distributed Store: Redis (Sessions, Locks, Pub/Sub)  │
└────────────────────────────────────────────────────────┘
```

---

## 9. Technology Stack

### Backend
- **Runtime:** Node.js (v18+ LTS, ES Modules)
- **Framework:** Express.js 4.19
- **Real-Time Transport:** Socket.IO 4.8
- **Primary Database:** MongoDB Atlas (Mongoose 8.5, WiredTiger, Multi-document ACID replica set)
- **Distributed Cache:** Redis (Redis 7+ / Memory Adapter fallback for single-instance)
- **Cryptography & Security:** `bcryptjs`, `jsonwebtoken` (CSPRNG 256-bit), native Node `crypto`

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 6
- **Routing:** React Router DOM 6
- **Real-Time Client:** Socket.IO Client 4.8

---

## 10. AI Capabilities (Clinical Decision Support)
- **OCR Prescription Extraction:** Extracts medication name, dosage strength, frequency, and instructions from physical images.
- **Clinical Safety Rules:**
  - AI **never** diagnoses autonomously.
  - AI **never** prescribes autonomously.
  - AI **never** approves prescriptions.
  - AI output is strictly forced to `status: "draft"` (`aiaudits`).
  - Doctor review and digital sign-off are **mandatory** before an Rx is active.
- **Adversarial Jailbreak Neutralization:** Sanitizes prompt injection patterns (`ignore previous instructions`).

---

## 11. Medication Intelligence & Adherence Loop
- **Adherence Scoring:** Tracks daily dose timestamps and recalculates percentage adherence.
- **Refill Depletion Intelligence:** Evaluates daily dosing velocity against total units dispensed to forecast run-out dates.
- **Automated Refill Signals:** Emits timely reminders when remaining supply falls below a 5-day threshold, allowing 1-click re-ordering.

---

## 12. Pharmacy Operations & Order State Flow
Fulfillment follows a deterministic state machine:
`PRESCRIPTION_REVIEW` → `NEW` → `ACCEPTED` → `PREPARING` → `PACKED` → `DISPATCHED` → `OUT_FOR_DELIVERY` → `DELIVERED` → `COMPLETED`
*(Exceptions: `CANCELLED`, `REJECTED`)*

---

## 13. PayPal Payment Architecture
- **Sole Primary Online Gateway:** PayPal REST API v2.
- **Server-Authoritative Pricing:** Overrides client price tampering.
- **Two-Phase Commit:** Inventory reserved on order creation; committed on capture.
- **Cryptographic Webhooks:** Constant-time HMAC validation handles `PAYMENT.CAPTURE.COMPLETED`, `DENIED`, and `REFUNDED`.
- **Replay Defense:** Webhook event deduplication cache prevents double-commit.
- **Automated Reconciliation:** Scans and resolves pending orders.
*(Razorpay is excluded and is NOT part of the production payment strategy).*

---

## 14. Security Architecture & Controls
- **JWT Cryptography:** 64-character hexadecimal CSPRNG keys; weak secrets rejected by startup validator.
- **No Hardcoded Fallbacks:** Production mode throws immediate fatal exceptions if `JWT_SECRET` is missing.
- **OWASP Matrix Verified:** Comprehensive defenses against NoSQL injection, XSS, CSRF, IDOR, and mass assignment.
- **Upload Defense:** Binary magic-byte inspection blocks renamed executables.
- **Audit Logging:** Tamper-evident SHA-256 chained transaction logs in `clinicalaudits` and `securityevents`.

---

## 15. Database Architecture (15 Canonical Collections)
Authoritative database `trimedi` on cluster `cluster0.j4elnei.mongodb.net`:
1. `users` (3 indexes)
2. `appointments` (6 indexes)
3. `clinicqueues` (10 indexes)
4. `consultations` (9 indexes)
5. `prescriptions` (7 indexes)
6. `medications` (9 indexes)
7. `products` (6 indexes, 50 pharmaceutical items)
8. `orders` (15 indexes)
9. `notifications` (7 indexes)
10. `conversations` (5 indexes)
11. `messages` (5 indexes)
12. `clinicalaudits` (12 indexes)
13. `securityevents` (5 indexes)
14. `consents` (5 indexes)
15. `aiaudits` (11 indexes)
*Total: 115 verified indexes, 0 missing indexes.*

---

## 16. Local Development Setup

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$
- MongoDB Atlas cluster or local MongoDB instance

### Installation
```bash
git clone https://github.com/nikamaditya249/TriMedi-Intelligent-Healthcare-Ecosystem.git
cd TriMedi-Intelligent-Healthcare-Ecosystem

# Install Backend Dependencies
cd backend && npm install

# Install Frontend Dependencies
cd ../frontend && npm install
```

---

## 17. Environment Variables Configuration

Copy templates to `.env`:
```bash
cd backend
cp .env.example .env
```

Configure `backend/.env`:
```ini
NODE_ENV=development
APP_ENV=development
PORT=5001
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/trimedi
JWT_SECRET=replace_with_a_secure_jwt_secret_key_minimum_32_characters
PAYPAL_CLIENT_ID=sb
PAYPAL_CLIENT_SECRET=
PAYPAL_ENVIRONMENT=sandbox
```

---

## 18. Running the Backend Server
```bash
cd backend
npm start
# Server listens on http://localhost:5001
```

Verify backend health:
```bash
curl http://localhost:5001/live
curl http://localhost:5001/ready
```

---

## 19. Running the Frontend Application
```bash
cd frontend
npm run dev
# Application accessible at http://localhost:5173
```

---

## 20. Database Initialization & Seeding
```bash
cd backend
# Synchronize 15 collections and 115 indexes
npm run db:init

# Seed 50-item canonical pharmaceutical catalog
npm run db:seed
```

---

## 21. Database Verification
Verify cluster health, indexes, and ACID transactions:
```bash
cd backend
npm run db:verify
```

---

## 22. Running Automated Tests

```bash
cd backend

# Run PayPal Suite, Negative Security Matrix & Production Smoke Test
npm test

# Run individual verification suites
node test_audit.js
node test_phase2_workflow.js
node test_phase3_medication_ai.js
node test_phase4_commerce_fulfillment.js
node test_phase4_5_production_hardening.js
node test_phase5_security_privacy.js
node test_phase5_5_production_readiness.js
node test_phase5_75_pilot_validation.js
node test_phase5_9_production_gate.js
node test_phase5_95_paypal_production.js

# Run attack simulations and disaster drills
node scripts/security_attack_simulation.js
node scripts/backup_restore_drill.js
node scripts/verify_secret_hygiene.js
node scripts/production_smoke_test.js
```

---

## 23. Production Deployment Overview
See [`docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md`](docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md) for full deployment instructions.

Compile production bundle:
```bash
cd frontend && npm run build
```

---

## 24. Documentation Structure

All operational and architectural documentation is organized by domain in the [`docs/`](docs/) directory:

```
docs/
├── architecture/
│   └── PRODUCTION_ARCHITECTURE.md        # Core system architecture & data flow
├── deployment/
│   ├── REDIS_PRODUCTION_READINESS.md     # Distributed scaling & Redis specifications
│   ├── ROLLBACK_RUNBOOK.md               # Multi-layer rollback procedures
│   └── PRODUCTION_DEPLOYMENT_RUNBOOK.md  # Step-by-step production deployment
├── security/
│   ├── SECURITY_ARCHITECTURE.md          # Defense-in-depth, RBAC & IDOR defenses
│   ├── THREAT_MODEL.md                   # STRIDE risk assessment across 15 scenarios
│   └── VENDOR_SECURITY_REGISTER.md       # Third-party cloud vendor governance
├── operations/
│   ├── OBSERVABILITY.md                  # Telemetry, correlation IDs & sanitization
│   ├── INCIDENT_RESPONSE.md              # 6-phase SIRP for 10 operational disaster modes
│   └── DEFERRED_EXTERNAL_BLOCKERS.md     # The authoritative deferred blockers register
├── compliance/
│   ├── COMPLIANCE_STATUS.md              # DPDP Act & Telemedicine statutory status
│   ├── LEGAL_REVIEW_CHECKLIST.md         # 17-domain compliance evaluation checklist
│   ├── PRIVACY_POLICY.md                 # Patient privacy policy
│   ├── TERMS_OF_SERVICE.md               # User terms of service
│   └── PRIVACY_DATA_CLASSIFICATION.md    # Healthcare data classification scheme
├── payments/
│   └── PAYPAL_ARCHITECTURE.md            # PayPal capture, webhooks & reconciliation
├── ai/
│   ├── AI_SAFETY.md                      # Clinical non-delegation & safety guardrails
│   └── MEDICAL_AI_DISCLAIMER.md          # Mandatory clinical disclaimer
├── pharmacy/
│   └── PHARMACY_OPERATIONS.md            # State machine, prescription gates & inventory
├── database/
│   └── DATABASE_ARCHITECTURE.md          # 15 collections, 115 indexes & lifecycle scripts
├── testing/
│   └── PERFORMANCE_TESTING.md            # Load benchmarks, latency & resource profiles
└── pilot/
    └── CONTROLLED_PILOT_PLAN.md          # Controlled clinic pilot operating protocol
```

---

## 25. Current Project Status

```
============================================================
TRIMEDI RELEASE GATE STATUS (PHASE 6)
============================================================
TECHNICALLY VERIFIED:   YES (100% Pass)
AUTOMATED REGRESSION:   366 / 366 Points Pass (0 Regressions)
PRODUCTION SMOKE TEST:  22 / 22 Steps Pass (100%)
PUBLIC PRODUCTION GO:   NO — PRODUCTION BLOCKED
REASON:                 Four External Blockers Remain Deferred
============================================================
```

---

## 26. Deferred External Blockers

The following four external blockers are intentionally deferred and tracked in [`docs/operations/DEFERRED_EXTERNAL_BLOCKERS.md`](docs/operations/DEFERRED_EXTERNAL_BLOCKERS.md):

1. **Legacy Atlas User Revocation (`adityanikams73_db_user`):** Requires DBA to log into MongoDB Atlas Cloud Console, permanently delete the user, and record the deletion confirmation.
2. **Formal Legal / Privacy Counsel Sign-Off:** Requires licensed healthcare and data-privacy legal counsel to execute formal written compliance approval.
3. **PayPal LIVE Merchant Activation:** Requires corporate finance onboarding, merchant KYC completion, and live REST credentials configuration.
4. **PayPal LIVE Webhook Registration:** Requires registering `https://api.trimedi.health/api/paypal/webhook` in the PayPal Live Developer Dashboard.

---

## 27. Controlled Pilot Status
TriMedi is currently approved and operational for **Controlled Clinic Pilot Mode only** (limited to partner clinics, verified physicians, and consented patients). It is **not** launched for unrestricted public access.

---

## 28. Important Production Warnings

> [!WARNING]
> **NOT LEGALLY CERTIFIED YET:** Do not market or represent TriMedi as legally approved or certified under healthcare privacy laws until formal legal counsel has executed the statutory sign-off.

> [!WARNING]
> **PAYPAL IS NOT LIVE YET:** Do not attempt live customer financial transactions until PayPal Live merchant KYC is completed and live credentials are configured.

> [!CAUTION]
> **AI IS ASSISTIVE ONLY:** TriMedi AI does not practice medicine. Licensed physicians must verify and sign all clinical prescriptions.

---

## License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
