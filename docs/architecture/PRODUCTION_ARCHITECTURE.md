# TriMedi Intelligent Healthcare Ecosystem
## Production Architecture & System Blueprint

**Document Reference:** `docs/architecture/PRODUCTION_ARCHITECTURE.md`  
**Classification:** Core System Architecture  
**Status:** Technically Verified / Controlled Pilot Architecture  

---

### 1. Architectural Overview & Tiered Flow

The TriMedi platform is architected as an asynchronous, event-driven, micro-modular healthcare engine enforcing strict clinical, commercial, and legal boundaries.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Tier                           │
│        React 18 + Vite SPA (Patient / Doctor / Pharmacy)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (REST) / WSS (Socket.IO)
┌──────────────────────────────▼──────────────────────────────┐
│                    API Gateway & Routing                    │
│      Express 4 + Reverse Proxy (TLS Termination, CORS)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Authentication & Guardrails                │
│    JWT (CSPRNG 256-bit) + configValidator + dbGuard (503)    │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
┌──────────────▼─────┐ ┌───────▼─────┐ ┌───────▼─────────────┐
│  Clinical Services │ │ AI Services │ │  Pharmacy & Orders  │
│  - Appointments    │ │ - Assistive │ │  - Catalog & Stock  │
│  - Clinic Queues   │ │   OCR Draft │ │  - GST Tax Engine   │
│  - Consultations   │ │ - Non-      │ │  - Concurrency Lock │
│  - EHR Records     │ │   delegable │ │  - State Machine    │
└──────────────┬─────┘ └───────┬─────┘ └───────┬─────────────┘
               │               │               │
┌──────────────▼───────────────▼───────────────▼──────────────┐
│              Financial Services & Fulfillment               │
│     PayPal REST API v2 (Authoritative Pricing, Webhooks)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                Notification & Audit Engine                  │
│  Socket.IO Real-Time Dispatch + SHA-256 Chained Audit Trail  │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼─────────────┐   ┌─────────────▼──────────────┐
│   Primary Data Store       │   │  Distributed Cache & Store │
│   MongoDB Atlas Replica Set│   │  Redis (Pub/Sub, Locks,    │
│   (15 Canonical Collections)│  │  Blacklists, Rate Limits)  │
└────────────────────────────┘   └────────────────────────────┘
```

---

### 2. Service Boundaries & Data Flow

#### A. Ingestion & Authentication
1. **Client Request:** Authenticates via `POST /api/auth/login` or `POST /api/auth/register`.
2. **Token Minting:** Backend issues signed JWT with 64-character server-side secret (`crypto.randomBytes(32)`).
3. **Session Interception:** `authMiddleware.js` extracts user claims, verifies signature, checks the revocation blacklist, and injects `req.user`.

#### B. Clinical Care Continuum
1. **Intake & Queue:** Patient books appointment; receptionist checks in patient to `clinicqueues`.
2. **Consultation Encounter:** Doctor initiates encounter via `consultations` route; vitals and SOAP notes are recorded.
3. **Assistive AI Pipeline:** Prescription images ingested via OCR; forced strictly into `status: "draft"` (`aiaudits` logged).
4. **Physician Review & Sign-off:** Physician verifies medications and stamps digital signature, transitioning Rx to `ACTIVE`.

#### C. Pharmacy Commerce & Fulfillment
1. **Catalog Valuation:** Client cart items valued using authoritative catalog prices; client prices discarded.
2. **Tax Engine:** Dual-tax GST engine computes intrastate (CGST 6% + SGST 6%) or interstate (IGST 12%).
3. **Inventory Reservation:** Stock atomically reserved via multi-document ACID transactions; concurrency locks prevent oversell.
4. **PayPal Capture:** Server authenticates against PayPal REST API; captures funds and commits inventory atomically.

---

### 3. Reliability Analysis & Failure Modes

| Component | Single Point of Failure (SPOF)? | Failure Mode | Mitigation & Recovery Mechanism |
|---|---|---|---|
| **MongoDB Atlas** | No (3-node replica set) | Primary node failover / connection drop | Mongoose auto-reconnect with exponential backoff; `dbGuard.js` trips HTTP 503 `DATABASE_UNAVAILABLE` fail-safe |
| **Redis Cache** | Mitigated | Redis node crash / unreachable | `SecurityStore` falls back to single-instance memory store; logs `REDIS_UNAVAILABLE` alert |
| **Backend API** | Mitigated via clustering | Node process uncaught exception | Process manager (PM2 / Kubernetes) restarts container; `/live` probe signals liveness failure |
| **PayPal API** | External dependency | PayPal network timeout / service outage | Orders remain `PENDING`; `ReconciliationService` scans batch for delayed capture status |
| **Socket.IO** | Mitigated via Redis adapter | WebSocket server disconnect | Client auto-reconnects with exponential jitter; room state re-established on reconnect |

---

### 4. Secret Management & Isolation Boundaries

- **Zero Client Exposure:** Database credentials, JWT secrets, PayPal client secrets, and AI API keys are **STRICTLY SERVER-ONLY**.
- **Startup Enforcement:** `configValidator.js` validates environment parameters before HTTP listening begins.
- **Log Sanitization:** Sensitive fields (`password`, `token`, `secret`, `authorization`, `PAN`) are scrubbed before writing to logs.

---

### 5. Scaling Limitations & Horizontal Growth

1. **Current Controlled Pilot State:** Single-instance or vertically scaled multi-core deployment using Node cluster mode.
2. **Multi-Instance Scaling Requirement:** To scale horizontally across multiple container pods, Redis MUST be configured for distributed token blacklisting, rate-limiting counters, and Socket.IO adapter broadcasting.
