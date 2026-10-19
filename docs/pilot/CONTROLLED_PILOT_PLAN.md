# TriMedi Intelligent Healthcare Ecosystem
## Controlled Clinic Pilot Plan & Operational Protocol

**Document Reference:** `docs/pilot/CONTROLLED_PILOT_PLAN.md`  
**Classification:** Clinical Pilot Governance & Operations  
**Status:** Pilot Operational Protocol (Pre-Public Launch)  

---

### 1. Executive Summary & Controlled Pilot Scope

> [!IMPORTANT]
> **THIS IS A CONTROLLED PILOT, NOT A PUBLIC COMMERCIAL LAUNCH.**
> The TriMedi platform operates in a tightly bounded clinical pilot environment designed to gather real-world clinician and patient feedback while verifying end-to-end reliability.

#### Pilot Boundaries & Quotas
- **Participating Clinics:** 1 to 3 designated partner outpatient clinics.
- **Participating Physicians:** 5 verified Registered Medical Practitioners (RMPs).
- **Participating Pharmacies:** 1 licensed partner retail pharmacy for fulfillment.
- **Enrolled Patients:** Capped at 100 consented pilot participants.
- **Payment Gateway:** PayPal Sandbox / controlled nominal testing mode.

---

### 2. Feature Flags & Operational Gates

To ensure clinical safety during the pilot, key capabilities are guarded by server-authoritative feature flags:

```bash
# Server-authoritative feature flags
ENABLE_AI_PRESCRIPTION_EXTRACTION=true
ENABLE_AI_SUMMARIES=true
ENABLE_REFILL_PREDICTION=true
ENABLE_PHARMACY_ORDERING=true
ENABLE_PAYMENTS=true
ENABLE_REALTIME_QUEUE=true
```

If any anomaly occurs in an automated subsystem, the feature flag can be toggled to `false` in real time, reverting that specific workflow to manual clinical entry without system downtime.

---

### 3. Daily Pilot Operational Workflow

```
08:30 AM ──> Morning Pre-Flight Probe (/live, /ready, /health)
09:00 AM ──> Clinic Reception Queue Activation
09:30 AM ──> Consultations, Assistive OCR, Physician Sign-Off
12:00 PM ──> Mid-Day Pharmacy Order Reconciliation
05:30 PM ──> Daily Clinical Audit Export & Backup Snapshot
```

#### Step 1: Morning Health Verification
```bash
curl -f http://localhost:5001/live
curl -f http://localhost:5001/ready
curl -f http://localhost:5001/health
```

#### Step 2: Clinic Queue & Consultation Operations
- Receptionist logs into queue dashboard; issues physical tokens linked to patient records.
- Doctor conducts consultations; vitals and diagnoses are recorded in longitudinal encounter notes.
- If physical prescription image is uploaded, OCR extracts medication draft; doctor **must** review, modify, and sign before Rx becomes active.

#### Step 3: Pharmacy Fulfillment
- Partner pharmacy receives verified prescription orders.
- Dispenses stock, updates state (`ACCEPTED` → `PREPARING` → `PACKED` → `DISPATCHED`).
- Confirms delivery and triggers adherence reminder scheduling.

#### Step 4: Evening Audit & Backup
```bash
# Execute automated backup drill to snapshot the day's clinical records
node backend/scripts/backup_restore_drill.js
```

---

### 4. Pilot Support & Escalation Procedures

| Issue Category | Severity | Primary Responder | Escalation Path | Resolution SLA |
|---|---|---|---|---|
| **Clinical Safety Issue** | P0 | Lead Physician | Chief Medical Officer | Immediate ($< 15\text{ mins}$) |
| **Data Access / IDOR Defect** | P0 | Security Lead | DevSecOps Emergency Desk | Immediate ($< 30\text{ mins}$) |
| **Database Connection Drop** | P1 | DevOps Engineer | Database Administrator (DBA) | $< 15\text{ mins}$ |
| **Prescription OCR Glitch** | P2 | Fullstack Engineer | Fallback to manual entry | $< 2\text{ hours}$ |
| **Notification Delay** | P3 | Backend Engineer | Notification Provider Desk | $< 4\text{ hours}$ |

---

### 5. Pilot Rollback & Containment Strategy

If a critical clinical safety or security defect is detected during clinic hours:
1. **Immediate Tri-State Freeze:** Flip `ALLOW_PILOT_MOCKS=false` and isolate the affected clinic queue.
2. **Feature Toggle:** Disable `ENABLE_AI_PRESCRIPTION_EXTRACTION` to force 100% manual prescription authoring.
3. **Application Rollback:** Follow [`docs/deployment/ROLLBACK_RUNBOOK.md`](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/docs/deployment/ROLLBACK_RUNBOOK.md) to revert API code.
4. **Data Preservation:** Clinical records and audit events are never purged; all actions are retained for postmortem review.
