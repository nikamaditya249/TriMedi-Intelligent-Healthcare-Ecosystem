# TriMedi Controlled Clinic Pilot Operations Runbook

**Milestone:** Phase 5.75 — Controlled Clinic Pilot & Real-World Validation  
**Date:** October 17, 2026  
**Document Version:** 1.0.0-RUNBOOK  
**Audience:** Clinic IT Operations, System Administrators, Clinical Supervisors, Platform Reliability Engineers  

---

## 1. Pilot Environment Architecture & Bootstrapping

The controlled pilot clinic operates as an isolated, containerized healthcare service with strict data separation:

```
+-------------------------------------------------------------------------+
|                  CONTROLLED PILOT CLINIC INFRASTRUCTURE                 |
|                                                                         |
|  [Frontend (Vite / React)] <---> [Backend Node.js API (Port 5001)]     |
|                                         |                               |
|                     +-------------------+-------------------+           |
|                     |                   |                   |           |
|            [MongoDB Pilot DB]   [SecurityStore]     [Razorpay Sandbox]  |
|            (trimedi_pilot)      (Memory Adapter)    (rzp_test_*)        |
+-------------------------------------------------------------------------+
```

### Pre-Flight Environment Checklist
Before clinical operations commence each morning, verify `.env` configuration:
```ini
# Environment Mode (Must be pilot)
APP_ENV=pilot
NODE_ENV=pilot
PORT=5001

# Dedicated Pilot Database (Never trimedi_production)
MONGO_URI=mongodb+srv://[PILOT_USER]:[PILOT_PASS]@cluster0.xxxx.mongodb.net/trimedi_pilot?retryWrites=true&w=majority

# Fail-Safe Database Guard
ALLOW_PILOT_MOCKS=false

# Security & Session Secrets
JWT_SECRET=pilot_high_entropy_secret_min_32_characters_long_2026

# India Payment Gateway (Test Mode)
RAZORPAY_KEY_ID=rzp_test_sample_key_id
RAZORPAY_KEY_SECRET=sample_test_secret
RAZORPAY_WEBHOOK_SECRET=sample_webhook_secret
```

---

## 2. Daily Clinical Operational Workflows

### Phase 1: Morning Platform Health Check (08:30 AM)
Run pre-clinic diagnostic check against running backend:
```bash
# 1. Process Liveness Probe
curl -s http://localhost:5001/live | jq .
# Expected: { "status": "ALIVE", "uptimeSeconds": ... }

# 2. Traffic Readiness Probe
curl -s http://localhost:5001/ready | jq .
# Expected: { "status": "READY", "mode": "pilot", "database": "connected" }

# 3. Internal System Telemetry
curl -s http://localhost:5001/health | jq .
# Expected: { "status": "HEALTHY", "components": { "database": { "status": "UP" }, "securityStore": ... } }
```

### Phase 2: Patient Registration & Reception Queue Management
1. **Patient Check-In:** Reception desk searches patient by name or phone.
2. **Queue Token Assignment:** Call `POST /api/reception/check-in` with `appointmentId`. The system assigns an ordered queue token (`Token: 1`, `Token: 2`).
3. **Queue Monitor:** Reception dashboard displays real-time queue status synced via Socket.IO events (`QUEUE_UPDATED`).

### Phase 3: Doctor Consultation & Clinical Encounter
1. **Encounter Initiation:** Doctor selects patient from waiting queue and opens the clinical workspace.
2. **Vitals Recording:** Doctor enters systolic/diastolic BP, pulse, temperature, and chief complaint (`POST /api/consultations`).
3. **AI Prescription Ingestion:** If uploading a scanned document, doctor clicks "Upload Prescription". The NLP engine parses text into structured fields annotating confidence scores.
4. **Draft Gate Enforcement:** The prescription is saved in `status: "draft"`. The doctor verifies medicine name, dosage form, intake frequency, and duration.
5. **Physician Sign-Off:** Doctor signs via `POST /api/prescriptions/:id/approve`. The prescription transitions to `active`, synchronizing the patient's daily medication schedule.

### Phase 4: Pharmacy Dispensing & 6-Stage Fulfillment
1. **Order Acceptance:** Pharmacy receives digital prescription order; asserts patient ownership and stock availability.
2. **Fulfillment State Machine Transitions:**
   $$\text{ACCEPTED} \longrightarrow \text{PREPARING} \longrightarrow \text{PACKED} \longrightarrow \text{DISPATCHED} \longrightarrow \text{OUT\_FOR\_DELIVERY} \longrightarrow \text{DELIVERED}$$
3. Order state updates are triggered via `PUT /api/orders/:id/status`.
4. **Inventory Commit:** Stock on hand is decremented upon order dispatch (`commitStock`).

### Phase 5: Evening Financial Reconciliation & Audit (06:00 PM)
Run reconciliation scanner:
```bash
# Verify payment capture vs fulfilled orders
node -e "
  import('./services/reconciliationService.js').then(async ({ reconcilePendingPayments }) => {
    const res = await reconcilePendingPayments();
    console.log('Reconciliation result:', res);
    process.exit(0);
  });
"
```

---

## 3. Incident Response Runbooks

### Incident A: Unauthorized Clinical Access Attempt (IDOR / Least Privilege Breach)
- **Symptom:** Log event `UNAUTHORIZED_CLINICAL_ACCESS` or `ACCESS_DENIED_IDOR`.
- **Immediate Containment:**
  1. The API middleware automatically terminates the request with HTTP 403 Forbidden.
  2. If repeated $> 5$ times in 1 minute, the IP address is throttled by `securityStore.checkRateLimit`.
  3. Administrator reviews actor email via Security Dashboard (`/app/admin/dashboard`).
- **Post-Incident Action:** Invalidate all active sessions for the offending user:
  ```bash
  node -e "
    import('./services/securityStore.js').then(async ({ default: s }) => {
      await s.invalidateUserSessions('attacker@trimedi.health');
      console.log('User sessions terminated across all devices.');
      process.exit(0);
    });
  "
  ```

### Incident B: Compromised Account Credentials
- **Symptom:** User reports unauthorized login or suspicious order placement.
- **Immediate Containment:**
  1. Admin immediately revokes active JWT and invalidates sessions across all devices via `securityStore.invalidateUserSessions(userEmail)`.
  2. Trigger password reset with high-entropy cryptographic token (`POST /api/auth/forgot-password`).
  3. Single-use token expires in 15 minutes and is invalidated immediately upon first use.

### Incident C: Payment Webhook Forgery Attack
- **Symptom:** Incoming `POST /api/payment/razorpay/webhook` with invalid `x-razorpay-signature`.
- **Immediate Containment:**
  1. Payment handler computes HMAC-SHA256 signature using `RAZORPAY_WEBHOOK_SECRET` over raw body buffer.
  2. Mismatch fails safe with HTTP 400 Bad Request.
  3. System logs `PAYMENT_WEBHOOK_FORGERY_DETECTED` with high severity to audit database.
  4. Discard webhook payload; zero orders transition to `PAID` without valid cryptographic signature.

### Incident D: Database Outage & Fail-Safe Behavior
- **Symptom:** MongoDB cluster unreachable (`readyState !== 1`); `/ready` returns HTTP 503 `DATABASE_UNAVAILABLE`.
- **Immediate Containment:**
  1. Under `APP_ENV=pilot` without `ALLOW_PILOT_MOCKS=true`, `dbGuard.js` unconditionally blocks all clinical, financial, and prescription writes.
  2. No data is stored in volatile server memory.
  3. System administrator notifies on-call infrastructure lead.
  4. Once database connectivity recovers, `/ready` automatically returns HTTP 200 `READY`.

---

## 4. Daily Backup & Disaster Recovery Procedures

### Automated Backup Execution (Every 6 Hours)
```bash
# Run staging backup snapshot
node scripts/backup_restore_drill.js
```
Backups are archived with timestamped JSON files in `backend/data/backups/`.

### Emergency Point-in-Time Restore Runbook
In case of local database corruption:
```bash
# 1. Halt API server traffic
npm stop

# 2. Restore from latest verified snapshot
node -e "
  import fs from 'fs';
  const latestBackup = fs.readdirSync('./data/backups').filter(f => f.endsWith('.json')).pop();
  console.log('Restoring from:', latestBackup);
  // Re-instantiate collections
"

# 3. Restart API server
npm start
```

---

## 5. Escalation Contacts & On-Call Matrix

| Role | Contact | SLA | Primary Responsibility |
|---|---|---|---|
| **Platform Reliability Engineer** | `ops@trimedi.health` | 15 mins | Process liveness, MongoDB cluster connectivity |
| **Healthcare Security Lead** | `security@trimedi.health` | 15 mins | Threat alerts, break-glass review, credential revocation |
| **Clinical Director** | `clinical@trimedi.health` | 30 mins | Medical guidelines, AI extraction safety review |
| **Pharmacy Operations Lead** | `pharmacy@trimedi.health` | 30 mins | Inventory discrepancies, fulfillment bottlenecks |
