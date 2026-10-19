# TriMedi — Intelligent Healthcare Ecosystem

[![TriMedi Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-0f766e?style=for-the-badge&logo=netlify)](https://trimedi.netlify.app/)
[![License](https://img.shields.io/badge/License-MIT-slate?style=for-the-badge)](LICENSE)
[![Design System](https://img.shields.io/badge/Design%20System-TriMedi%20Teal%20%7C%20Slate-0f766e?style=for-the-badge)](frontend/tailwind.config.js)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-0f766e?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-0f766e?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO%20Gateway-0f766e?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-0f766e?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

---

## 🌟 Executive Overview

**TriMedi** is an intelligent, real-time healthcare ecosystem connecting patients, verified medical doctors, licensed pharmacies, and administrators through one unified digital care lifecycle:

$$\text{Patient} \longleftrightarrow \text{Doctor} \longrightarrow \text{Appointment} \longrightarrow \text{Digital Prescription} \longrightarrow \text{Medication Tracking} \longrightarrow \text{Refill Intelligence} \longrightarrow \text{Order Again} \longrightarrow \text{Prescription & Stock Validation} \longrightarrow \text{Razorpay / PayPal / COD} \longrightarrow \text{Cryptographic Verification} \longrightarrow \text{Pharmacy Fulfillment} \longrightarrow \text{Delivery Completion}$$

TriMedi is engineered as a production-grade healthcare technology platform: minimal, trustworthy, calm, accessible, and structured with clinical and commercial integrity.

---

## 🚀 Phase 4: Pharmacy, Payments, Real Commerce & Fulfillment

Phase 4 transforms TriMedi's medication ordering into an authoritative healthcare-commerce workflow:

### 1. India-First Payment Architecture (Razorpay + PayPal + COD)
- **Razorpay Integration**: Supports UPI, Net Banking, and Debit/Credit Cards.
- **Cryptographic Signature Verification**: Server authoritatively verifies payment signatures via HMAC SHA-256 (`crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')`) with `crypto.timingSafeEqual` to prevent side-channel timing attacks.
- **PayPal Provider**: Retained and standardized for international card payments.
- **Cash on Delivery (COD)**: Explicitly separated from prepaid orders; order is confirmed with payment status `PENDING` until physical delivery, transitioning to `PAID` upon receipt.
- **Webhook Replay Protection**: Processed event IDs ledger prevents duplicate orders, payments, stock deductions, or refunds on duplicate webhook deliveries.
- **Provider-Backed Refunds**: Server-initiated refunds for pharmacy order rejection or cancellations.

### 2. Authoritative Pricing & GST Taxation
- **Zero Client Trust**: All client-supplied prices, taxes, and totals are ignored. The backend retrieves unit prices from the database catalog.
- **Indian Healthcare GST Invoicing**: Configurable GST rates (5% and 12%) with automated intrastate split into **CGST** (50%) and **SGST** (50%), item price snapshots, and delivery fees.

### 3. Concurrency Protection & Atomic Stock Reservation
- **Safe Stock Lifecycle**: `Available -> Reserved -> Committed` (or `Released` on failure/cancellation).
- **Zero Overselling Guarantee**: Uses atomic conditional updates (`$expr: { $gte: [{ $subtract: ["$stockQuantity", "$reservedQuantity"] }, requestedQty] }`). Two concurrent buyers attempting to purchase the last unit (Stock = 1) will see exactly 1 succeed and 1 fail with zero negative stock.

### 4. Prescription Validation & Clinical Safety
- **Mandatory Server Verification**: For prescription-required drugs, the backend verifies:
  1. Prescription exists and is active/approved.
  2. Prescription belongs to the ordering patient (**IDOR Defense**).
  3. Prescription is not expired.
  4. Prescribed medicine matches requested item.
  5. Quantity does not exceed authorized duration.

### 5. Authoritative 10-Stage Pharmacy Fulfillment State Machine
$$\text{NEW} \longrightarrow \text{PRESCRIPTION\_REVIEW} \longrightarrow \text{ACCEPTED} \longrightarrow \text{PREPARING} \longrightarrow \text{PACKED} \longrightarrow \text{DISPATCHED} \longrightarrow \text{OUT\_FOR\_DELIVERY} \longrightarrow \text{DELIVERED} \longrightarrow \text{COMPLETED}$$
- **Role Transition Security**: Patients can only cancel prior to fulfillment preparation. Pharmacy controls acceptance, preparation, and packing. Dispatch/delivery controls transit and delivery.
- **Least-Privilege Clinical Privacy**: Pharmacy staff sees strictly dispensing-essential data (medicine name, strength, dosage, quantity, instructions). Private consultation notes, detailed psychiatric/diagnostic notes, and clinical histories are completely shielded.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Socket.IO Client, React Router v6, React Icons, Context API |
| **Backend** | Node.js, Express.js (ES Modules), Socket.IO, EventEmitter, BcryptJS, JWT, Node Crypto |
| **Database** | MongoDB Atlas / Mongoose (with dual-mode resilient local fallback) |
| **Payments** | Razorpay (UPI, Netbanking, Cards, HMAC SHA-256), PayPal Orders v2, Cash on Delivery (COD) |
| **Taxation** | Indian Healthcare GST (CGST + SGST Breakdown, HSN Codes) |
| **AI / NLP** | Google Gemini 1.5 Flash API / Deterministic Healthcare NLP Pipeline (Assistive Only) |
| **Testing** | Phase 2 Clinical Suite, Phase 3 AI/Medication Suite, Phase 4 Commerce Suite, Security Audit |
TriMedi uses **ONE centralized visual language** across all role portals—eliminating visual fragmentation, rainbow role themes, neon gradients, and legacy starter boilerplate.

### 1. Color System
- **Primary Brand**: Healthcare Deep Teal (`#0F766E` / `brand-700`), Dark Teal (`#115E59` / `brand-800`), Soft Teal Accent (`#CCFBF1` / `brand-100`).
- **Neutrals**: Professional Slate (`slate-50` through `slate-950`), providing crisp contrast and calm surfaces.
- **Semantic Statuses**:
  - `Success`: Restrained Emerald (`emerald-700` / `emerald-50`)
  - `Warning`: Restrained Amber (`amber-700` / `amber-50`)
  - `Danger / Destructive`: Restrained Rose/Red (`rose-700` / `rose-50`)
  - `Info`: Restrained Blue/Teal (`sky-700` / `sky-50`)

### 2. Standardized Component Library (`frontend/src/components/ui/`)
- **`Button`**: Consistent heights, padding, rounded-lg radius, loading spinner, and variants (`primary`, `secondary`, `outline`, `ghost`, `danger`).
- **`Card` & `StatCard`**: Clean borders (`border-slate-200/80`), restrained shadow (`shadow-sm`), and solid brand icon containers.
- **`Badge` & `StatusBadge`**: Standardized domain status tags for Appointments (*Scheduled, Confirmed, Completed, Cancelled*), Orders (*Pending, Processing, Dispensed, Delivered, Cancelled*), and Prescriptions (*Active, Expired, Completed*).
- **`Input` & `Select`**: Standard heights, clean focus rings (`focus:ring-brand-700`), helper text, and validation states.
- **`Table`**: Structured clinical tables with clear headers, hover states, status badges, and empty/loading feedback.
- **`Modal`**: Accessible dialogs with smooth backdrop transitions, header badges, and keyboard escape support.
- **`LoadingState`, `EmptyState`, `ErrorState`**: Uniform feedback components preventing raw errors, blank screens, or layout shifts.

### 3. Unified Application Shell
All roles (Patient, Doctor, Pharmacy, Admin) share a single responsive application shell:
- **Collapsible Sidebar**: Clean brand mark, role-specific workspace links, unified styling.
- **Top Header**: Global search, real-time live connection status indicator, notification center drawer, and profile switcher.
- **Mobile Responsive Drawer**: Clean hamburger navigation and responsive tables/grids across tablet and mobile viewport sizes.

---

## 🚀 Key Functional Capabilities

### 1. Role-Based Healthcare Workspaces
- **Patient Workspace**: Real-time medication supply bars, refill recommendations, digital prescription vault, appointment scheduling, consultation chat, and order tracking.
- **Doctor Clinical Portal**: Verified digital prescription issuer with dosage/frequency schedules, appointment queue management, and patient communication.
- **Pharmacy Dispensing Network**: Live order fulfillment queue with real-time status transitions (*Processing $\rightarrow$ Dispensed $\rightarrow$ Shipped $\rightarrow$ Delivered*), inventory control, and low-stock alerts.
- **Admin Governance Center**: System-wide telemetry, user directory, real-time WebSocket connection monitoring, background scheduler heartbeats, and audit logs.

### 2. Medication Supply Intelligence & Smart Refill Gap Engine
- **Deterministic Arithmetic Engine**: Evaluates prescribed duration against actual purchased supply to identify potential therapy shortage gaps.
- **Supply Visualizers**: In-app progress bars showing exact days elapsed, days remaining, and refill thresholds.
- **Proactive Refill Alerts**: Generates non-alarmist notifications when medication supply approaches $\le 5$ days remaining.

### 3. Automated "Order Again" Engine
- **Prescription Validation**: Verifies that the prescription exists, belongs to the authenticated patient, and is currently active.
- **Authoritative Server Pricing**: Directly queries the live catalog database to compute subtotals, GST, and shipping—preventing client-side price tampering.
- **Direct Checkout Transfer**: Seamlessly transitions validated refill drafts into checkout for payment via **PayPal**, **COD**, or **UPI**.

### 4. Real-Time Doctor-Patient Consultation Chat
- **Socket.IO Gateway**: Authenticated real-time communication channel with room isolation (`user_${email}`, `conv_${conversationId}`).
- **Features**: Live message exchange, typing indicators, read receipts, online/offline presence indicators, and message history persistence.
- **Security**: Strict server-side validation ensuring users can only join conversations where they are authorized participants.

### 5. AI-Assisted Clinical Guidance (Assistive Only)
- **Instruction Simplifier**: Translates complex clinical instructions and Latin dosing terms (e.g. *OD Nocte post cibus*) into clear daily routines.
- **Doctor Query Drafter**: Helps patients clearly frame symptom questions and queries for doctor consultations.
- **Consultation Summarizer**: Generates concise action items and key highlights from past consultations.
- **Prescription Scanner**: OCR extraction with mandatory doctor/patient human review before finalizing digital prescriptions.
- **Clinical Governance**: Prominent disclaimers clarify that AI recommendations are assistive and never replace licensed medical judgment.

### 6. Background Healthcare Scheduler
- **60-Second In-Process Timer**: Runs automated health checks for:
  - 24-hour and 1-hour upcoming appointment reminders
  - Medication supplies approaching the 3-day refill threshold
- **Database-Backed Idempotency**: Persistent checks against MongoDB ensure server restarts never create duplicate notifications.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Socket.IO Client, React Router v6, React Icons, Context API |
| **Backend** | Node.js, Express.js (ES Modules), Socket.IO, EventEmitter, BcryptJS, JWT |
| **Database** | MongoDB Atlas / Mongoose (with dual-mode resilient local fallback) |
| **Payments** | PayPal Orders API v2 (Authoritative Server-Side Capture), Cash on Delivery (COD), UPI |
| **AI / NLP** | Google Gemini 1.5 Flash API / Deterministic Healthcare NLP Pipeline |
| **Deployment** | Netlify (Frontend), Node.js Cloud Hosting (Backend) |

---

## 📂 Project Architecture

```
S73_AdityaNikam_TriMedi_Capstone/
├── backend/
│   ├── .env.example            # Environment template for dev/staging/prod
│   ├── data/                   # Default product catalog & seed data
│   ├── middleware/             # JWT & Session Authentication middlewares
│   ├── models/                 # Mongoose models (User, Order, Prescription, Appointment, Conversation, Message, Notification)
│   ├── routes/                 # REST API endpoints (auth, products, orders, prescriptions, appointments, chat, notifications, refill, ai, paypal)
│   ├── services/               # Socket.IO gateway, Domain EventBus, Background Scheduler
│   ├── index.js                # Server entry point with HTTP & Socket.IO listener
│   └── test_audit.js           # Automated Phase 1 & 3 security, socket, and persistence test suite
│
├── frontend/
│   ├── .env.example            # Client environment template (VITE_API_URL, VITE_SOCKET_URL)
│   ├── tailwind.config.js      # Centralized TriMedi design tokens (brand, slate, semantics)
│   ├── src/
│   │   ├── api.js              # Centralized resilient API client with friendly error handling
│   │   ├── components/
│   │   │   ├── ai/             # AI Assistant modal & AI Scanner modal
│   │   │   ├── appointments/   # Booking consultation modals
│   │   │   ├── chat/           # Real-time chat window & message bubbles
│   │   │   ├── intelligence/   # Medication supply timeline & gap tracker
│   │   │   ├── layout/         # AppShell, Navbar, Header, Sidebar, Footer
│   │   │   ├── notifications/  # Notification center modal
│   │   │   ├── prescriptions/  # Digital prescription creation modals
│   │   │   ├── refill/         # Order Again validation modal
│   │   │   └── ui/             # Standardized Design Tokens: Button, Card, Badge, StatusBadge, Input, Select, Table, Modal, Avatar
│   │   ├── context/            # AuthContext, CartContext, SocketContext
│   │   ├── pages/              # Landing, Auth, Products, Cart, Checkout, Profile, RoleSubpages
│   │   │   ├── dashboards/     # PatientDashboard, DoctorDashboard, PharmacyDashboard, AdminDashboard
│   │   │   └── chat/           # ChatPage
│   │   ├── App.jsx             # Route registry & Protected Routes
│   │   ├── index.css           # Global typography, clean healthcare surfaces, utility classes
│   │   └── main.jsx            # React root mount
│   └── package.json
└── Readme.MD
```

---

## ⚙️ Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas** connection string (optional; in-memory resilient fallback available)

### 1. Clone the Repository
```bash
git clone https://github.com/kalviumcommunity/S73_AdityaNikam_TriMedi_Capstone.git
cd S73_AdityaNikam_TriMedi_Capstone
```

---

## 🌐 Environment Deployment Lifecycle

TriMedi establishes a strict deployment boundary:

$$\text{DEVELOPMENT} \longrightarrow \text{STAGING} \longrightarrow \text{CONTROLLED PILOT} \longrightarrow \text{PRODUCTION}$$

### 1. Local Development (`APP_ENV=development`)
- Uses resilient in-memory adapters when remote cluster is offline.
- Test tokens and sandbox payment gateways active.
```bash
# Backend setup
cd backend
npm install
cp .env.example .env
npm start

# Frontend setup (separate terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

### 2. Staging Environment (`APP_ENV=staging`)
- Connects to dedicated non-production MongoDB Atlas staging cluster.
- Validates distributed security store and simulated webhook deliveries.
```bash
# Verify system readiness and health probes
curl -s http://localhost:5001/live
curl -s http://localhost:5001/ready
curl -s http://localhost:5001/health
```

### 3. Controlled Pilot (`APP_ENV=pilot`)
- Real clinical operations within bounded pilot partner clinics.
### 3. Controlled Pilot (`APP_ENV=pilot` & `NODE_ENV=pilot`)
- Deployment to isolated pilot clinic with dedicated `trimedi_pilot` database namespace.
- Single-instance deployment with local `securityStore` memory adapter.
- Server-authoritative GST pricing, strict order fulfillment state machine, and break-glass emergency access protocols active.
- Mandatory physician sign-off enforced on all AI-extracted prescriptions.
- In-memory database fallback mocks disabled by default (`ALLOW_PILOT_MOCKS=false`). If the database disconnects, mutating operations return HTTP 503 `DATABASE_UNAVAILABLE`.

### 4. Final Production Deployment Gate (`APP_ENV=production` & `NODE_ENV=production`)
- **Status:** **`NO-GO — PRODUCTION BLOCKED` (Pending External Manual & Statutory Gates)**
- **Technical Validation:** **100% COMPLETE** (222/222 Automated Tests Passed, 22/22 Smoke Test Steps Passed, Vite Build 0 Errors).
- **Production Gating Prerequisites:**
  1. **MongoDB Atlas Live Database Credential:** Place the newly generated rotated password into `backend/.env` for `MONGO_URI` with explicit `readWrite` granted on database `trimedi`. (Cluster0 is active and available).
  2. **PayPal Live Production Gateway Activation:** Provision live production credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT=live`) and complete business KYC onboarding.
  3. **Production Secret Generation:** Replace development `JWT_SECRET` with a 64-character random string.
  4. **Redis Multi-Instance Cluster:** Deploy managed Redis cluster (`REDIS_URL`) prior to scaling horizontally across multiple container replicas.

---

## 🗄️ Fresh MongoDB Atlas Initialization (Phase 5.96 / 5.97)

TriMedi connects to a fresh, authoritative MongoDB database (`trimedi`) without migrating compromised legacy databases. The bootstrap process is completely non-destructive and idempotent:

```bash
cd backend

# 1. Initialize all 15 canonical collections and synchronize indexes
node scripts/db_init.js

# 2. Non-destructively seed the 50-item pharmaceutical catalog (HSN 3004/9018, GST 12%/18%)
node scripts/db_seed.js

# 3. Verify probe CRUD, index integrity, and replica set ACID transactions
node scripts/db_verify.js

# 4. Run disaster recovery backup & restore drill (SHA-256 integrity verification)
node scripts/backup_restore_drill.js
```

---

## 💳 PayPal Primary Online Payment Integration

**Important Architectural Decision:** PayPal is the sole primary online payment provider for TriMedi. Razorpay has been fully deprecated and reclassified as **LEGACY / DISABLED / NON-PRODUCTION**.

- **Server-Authoritative Pricing:** Server calculates medicine costs, intrastate/interstate GST (CGST 6% + SGST 6% or IGST 12%), and delivery charges. Frontend pricing is completely ignored.
- **Atomic Stock Reservation:** Concurrency-safe inventory reservations prevent negative inventory or overselling under high traffic.
- **Cryptographic Capture Verification:** Server communicates directly with PayPal REST APIs to capture authorized orders; frontend success flags are not trusted.
- **Idempotency & Replay Defense:** Replayed captures and duplicate webhooks are recognized and neutralized without multiple charges or double inventory commits.
- **Automated Bounds-Checked Refunds:** Cancellations and rejections release reserved inventory and trigger audited refunds.

---

## 🧪 Comprehensive Automated Test Suites

TriMedi maintains 100% automated test coverage across **311 verifiable test points with zero regressions**:

```bash
cd backend

# Core Regression Suites (242 Tests):
node test_audit.js                             # Audit & EventBus (18 tests)
node test_phase2_workflow.js                   # Clinical Workflow (35 tests)
node test_phase3_medication_ai.js              # AI & Medication Adherence (41 tests)
node test_phase4_commerce_fulfillment.js       # Commerce & Pharmacy State Machine (29 tests)
node test_phase4_5_production_hardening.js     # Concurrency, GST & Invoicing (19 tests)
node test_phase5_security_privacy.js           # Security, Consent & DPDP Act (25 tests)
node test_phase5_5_production_readiness.js     # Health Probes & Fail-safes (19 tests)
node test_phase5_75_pilot_validation.js        # Pilot Gate & Secret Hygiene (20 tests)
node test_phase5_9_production_gate.js          # Pre-Production Gate (20 tests)
node test_phase5_95_paypal_production.js       # PayPal Production Architecture (16 tests)

# Specialized Production Verification Suites (69 Verification Points):
node scripts/security_negative_matrix_test.js  # 20-Point Negative Security Matrix (20 tests)
node scripts/production_smoke_test.js          # 22-Step Clinical Smoke Test (22 steps)
node scripts/backup_restore_drill.js           # 15 Collections Disaster Recovery (15 entities)
node scripts/test_connection_failure.js        # 503 Readiness Probe Shield (4 checks)
node scripts/verify_secret_hygiene.js          # Secret Leakage Audit (8 checks)

# Frontend Production Compilation:
cd ../frontend && npm run build                # Vite Production Bundle (0 errors)
```

---

## 📚 Phase 5.99 Final Production Certification Documentation

Detailed operational and technical reports are available in the repository root:
1. [PHASE_5_99_PRODUCTION_BLOCKER_CLEARANCE_REPORT.md](PHASE_5_99_PRODUCTION_BLOCKER_CLEARANCE_REPORT.md) — Master Blocker Clearance Report
2. [FINAL_GO_LIVE_CERTIFICATION.md](FINAL_GO_LIVE_CERTIFICATION.md) — Authoritative Release Gate & Certification
3. [FINAL_MONGODB_GO_LIVE_VERIFICATION.md](FINAL_MONGODB_GO_LIVE_VERIFICATION.md) — MongoDB Atlas Verification & Network Audit
4. [FINAL_PAYPAL_GO_LIVE_VERIFICATION.md](FINAL_PAYPAL_GO_LIVE_VERIFICATION.md) — PayPal Live Production Gateway & KYC Gate
5. [FINAL_PRODUCTION_SECRET_VERIFICATION.md](FINAL_PRODUCTION_SECRET_VERIFICATION.md) — Cryptographic Secret & JWT Rotation Audit
6. [FINAL_LEGAL_COMPLIANCE_GATE.md](FINAL_LEGAL_COMPLIANCE_GATE.md) — Healthcare Telemedicine & DPDP Act Compliance Audit
7. [FINAL_SECURITY_SIGNOFF.md](FINAL_SECURITY_SIGNOFF.md) — 20-Point Negative Security Matrix & Clinical Shield Sign-Off
8. [FINAL_PRODUCTION_SMOKE_TEST.md](FINAL_PRODUCTION_SMOKE_TEST.md) — 22-Step Clinical & Commercial Continuum
9. [FINAL_GO_LIVE_CHECKLIST.md](FINAL_GO_LIVE_CHECKLIST.md) — Blocker Classification Matrix (P0–P3)
10. [PRODUCTION_DEPLOYMENT_RUNBOOK.md](PRODUCTION_DEPLOYMENT_RUNBOOK.md) — Step-by-Step Production Cutover Runbook
11. [PRODUCTION_ROLLBACK_RUNBOOK.md](PRODUCTION_ROLLBACK_RUNBOOK.md) — Emergency Rollback & Recovery Procedures

---

## 🔐 Demo Credentials

The platform includes built-in 1-click demo logins on the `/auth` page for all five healthcare roles:
- **Patient**: `aditya@trimedi.health` / `patient@trimedi.health` (password: `password123`)
- **Doctor**: `doctor@trimedi.health` (Verified MD Specialist) (password: `password123`)
- **Reception**: `reception@trimedi.health` (Metro Health Front Desk) (password: `password123`)
- **Pharmacy**: `pharmacy@trimedi.health` (password: `password123`)
- **Admin**: `admin@trimedi.health` (password: `password123`)

---

## 📋 Feature Status Matrix

| Feature Domain | Status | Notes |
| :--- | :--- | :--- |
| **TriMedi Design System** | **Implemented** | Centralized Deep Teal tokens, typography, cards, badges, inputs, buttons, tables, modals |
| **Application Shell** | **Implemented** | Unified sidebar, header, role switcher, notification drawer, responsive layouts |
| **Reception Desk Workflow** | **Implemented** | Today's appointments, walk-in registration, 1-click check-in, live queue management |
| **Doctor Consultation Workspace** | **Implemented** | Patient header, vitals capture, clinical notes, diagnosis, longitudinal history, Rx builder |
| **Longitudinal Medical Record** | **Implemented** | Append-only clinical timeline tracking consultations, vitals, and verified prescriptions |
| **Clinic Waiting Room Queue** | **Implemented** | Token numbering, estimated wait, real-time Socket.IO triage synchronization |
| **Prescription Lifecycle & MD Sign-off** | **Implemented** | Draft/reviewed/approved/active states; AI extractions require explicit MD sign-off |
| **Clinical Least Privilege & IDOR** | **Implemented** | Reception/Pharmacy restricted from clinical notes; cross-patient IDOR blocked |
| **Clinical Audit Trail** | **Implemented** | Immutable logging of check-ins, encounters, prescriptions, and credential changes |
| **Doctor Credential Verification** | **Implemented** | State registry tracking (`verified`, `under_review`, `pending`) with admin control |
| **Authentication & RBAC** | **Implemented** | JWT auth, demo accounts, role protected routes, zero frontend secret leaks |
| **Medication Catalog & Cart**| **Implemented** | Product browsing, category pills, cart management, authoritative checkout |
| **Orders & Payment Gateway** | **Implemented** | PayPal Orders API v2, Cash on Delivery, UPI direct simulation |
| **Medication Refill Engine** | **Implemented** | Refill gap calculation, supply progress bars, Order Again draft builder |
| **Socket.IO Consultation Chat**| **Implemented** | Real-time messages, typing indicators, read receipts, room authorization |
| **Event-Driven Notifications** | **Implemented** | Centralized EventBus, category feeds, unread badge counter |

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
