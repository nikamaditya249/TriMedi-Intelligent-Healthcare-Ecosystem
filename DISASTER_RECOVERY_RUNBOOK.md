# TriMedi Platform — Disaster Recovery & Business Continuity Runbook

**Author:** DevSecOps & Platform Reliability Engineering Team  
**Date:** October 17, 2026  
**Ecosystem:** TriMedi — Intelligent Healthcare Ecosystem  
**Classification:** Internal Operational Runbook (Level 2)  
**Applicability:** Staging, Controlled Pilot, Production  

---

## 1. Objectives, Recovery Targets & SLAs

TriMedi manages protected health information (PHI) and financial transactions. Business continuity procedures are designed to meet strict Recovery Point Objectives (RPO) and Recovery Time Objectives (RTO):

| Tier | Category | RPO Target | RTO Target | Architecture / Mechanism |
|---|---|---|---|---|
| **Tier 1 (Critical)** | Active Prescriptions, Consultations, Orders, Payments | $\le 1\text{ minute}$ | $\le 15\text{ minutes}$ | Continuous Atlas replica set oplog replication + Continuous Cloud Backups |
| **Tier 2 (High)** | Appointment Schedules, Patient Profiles, Adherence Records | $\le 15\text{ minutes}$ | $\le 30\text{ minutes}$ | Automated 6-hour point-in-time snapshots |
| **Tier 3 (Medium)** | Uploaded Prescription Files (PDF/PNG), Audit Logs | $\le 1\text{ hour}$ | $\le 1\text{ hour}$ | S3/Blob storage cross-region replication + Versioning |

- **Backup Frequency:** Continuous continuous oplog capture; hourly incremental snapshots; daily full snapshots.
- **Backup Retention:** 30 days of continuous point-in-time recovery (PITR); 7-year cold archival for statutory healthcare compliance.
- **Backup Encryption:** AES-256 at rest (KMS-managed keys); TLS 1.3 in transit.
- **Access Control:** Restricted strictly to designated Lead DevSecOps Engineers via multi-factor authentication (FIDO2/WebAuthn).

---

## 2. Standard Disaster Scenarios & Recovery Procedures

```
                       +-------------------------------+
                       |   DISASTER INCIDENT DETECTED  |
                       +-------------------------------+
                                       |
                                       v
         +-----------------------------------------------------------+
         | 1. Assess Impact Tier (Database / Auth / Payment / Data)  |
         | 2. Declare Incident Level (P1 / P2 / P3)                  |
         | 3. Route to Specific Scenario Runbook Below              |
         +-----------------------------------------------------------+
```

---

### Scenario 1: MongoDB Cluster Outage (Network Partition / Cloud Failure)

**Symptoms:**
- API returns HTTP 503 `DATABASE_UNAVAILABLE`.
- `/ready` probe returns `status: "NOT_READY"`.
- Error logs indicate `MongooseServerSelectionError` or `ENOTFOUND`.

**Immediate Mitigation:**
1. **Verify Cloud Health:** Check MongoDB Atlas Status dashboard (https://status.mongodb.com).
2. **Inspect Connection Pool:**
   ```bash
   # Test TCP handshake and TLS reachability
   nc -zv -w 5 <atlas-cluster-host> 27017
   ```
3. **Trigger Replica Failover:**
   - If the Primary node is unresponsive, Atlas automatically initiates election ($\le 30\text{s}$).
   - If split-brain occurs, initiate manual failover via Atlas Console: `Clusters -> Configuration -> Test Failover`.
4. **Resilient Gateway Behavior:**
   - In production (`APP_ENV=production`), TriMedi strictly halts write operations with HTTP 503 rather than creating in-memory mock data.
5. **Post-Recovery Health Check:**
   ```bash
   curl -s http://localhost:5001/ready | jq .
   ```

---

### Scenario 2: Database Data Corruption (Schema Malformation / Faulty Migration)

**Symptoms:**
- Schema validation exceptions on existing documents.
- Corrupted clinical dosage schedules or missing referenced fields.

**Recovery Procedure:**
1. **Halt Mutating API Traffic:**
   - Direct load balancer to display maintenance page:
     ```nginx
     return 503 '{"status":"MAINTENANCE","message":"Database maintenance in progress."}';
     ```
2. **Initiate Point-in-Time Recovery (PITR):**
   - Access MongoDB Atlas Console -> `Backup` -> `Restore`.
   - Select point-in-time timestamp immediately prior to corruption event ($T - 5\text{ mins}$).
   - Restore into a staging cluster: `trimedi-recovery-temp`.
3. **Data Verification & Patching:**
   - Execute differential comparison script against corrupted collections (`Prescription`, `Consultation`, `Order`).
   - Run schema integrity test:
     ```bash
     node backend/test_phase5_5_production_readiness.js
     ```
4. **Repoint Application Connection:**
   - Update `MONGO_URI` in Cloud Secret Manager to point to restored cluster.
   - Restart backend application containers.

---

### Scenario 3: Accidental Bulk Deletion

**Symptoms:**
- Sudden drop in consultation records or appointment queues.
- `SecurityEvent` log records `BULK_DELETE_DETECTED`.

**Recovery Procedure:**
1. **Immediate Revocation of Offending Identity:**
   - Terminate active session via `invalidateUserSessions(actorEmail)`.
2. **Restore from Snapshot:**
   - Atlas Snapshots retain immutable hourly point-in-time copies.
   - Restore target collection using `mongorestore` with namespace mapping:
     ```bash
     mongorestore --uri="$MONGO_URI" --nsInclude="trimedi.consultations" dump/trimedi/consultations.bson
     ```
3. **Audit Trail Verification:**
   - Confirm write-only `AIAudit` and `SecurityEvent` ledgers were preserved.

---

### Scenario 4: Credential Compromise & Rotation (Database Secret Found)

**Trigger:** Discovered active connection strings in repositories, logs, or unencrypted configuration files.

**Immediate Containment & Manual Atlas Rotation Steps:**
1. **DO NOT commit new credentials to Git.**
2. **Step A: Create New Database User in Atlas:**
   - Log in to MongoDB Atlas Console (https://cloud.mongodb.com).
   - Navigate to `Security -> Database Access -> Add New Database User`.
   - Set Authentication Method: `Password`.
   - Generate a 32+ character cryptographically secure password via password manager.
   - Restrict User Privileges: Assign `readWrite` strictly to `trimedi_production` database (Principle of Least Privilege).
   - Add User.
3. **Step B: Inject New Secret into Cloud Vault:**
   - Update `MONGO_URI` in AWS Secrets Manager, Doppler, or HashiCorp Vault:
     ```bash
     # Doppler example
     doppler secrets set MONGO_URI="mongodb+srv://<new_user>:<new_password>@<cluster>.mongodb.net/trimedi_production?retryWrites=true&w=majority"
     ```
4. **Step C: Redeploy Backend Containers:**
   - Trigger rolling deployment to pick up new environment variables.
5. **Step D: Delete Compromised User:**
   - Return to Atlas Console -> `Security -> Database Access`.
   - Locate the compromised user (`adityanikams73_db_user`).
   - Click `Delete` to immediately invalidate any lingering external connections.
6. **Step E: Purge from Git History:**
   - Execute `git-filter-repo` on private mirrors if full history rewrite is scheduled.

---

### Scenario 5: Payment Inconsistency & Webhook Desynchronization

**Symptoms:**
- Customer card charged on Razorpay, but TriMedi order remains `NEW` or `PENDING`.
- Razorpay dashboard indicates `Webhook delivery failed (HTTP 500/504)`.

**Automated Recovery:**
- The automated **Reconciliation Scheduler** (`backend/services/reconciliationService.js`) runs every 60 seconds:
  1. Queries pending orders older than 5 minutes.
  2. Contacts payment gateway API (`Razorpay.orders.fetchPayments`).
  3. Automatically marks order `PAID` and commits inventory reservation upon detecting captured status.

**Manual Intervention (if required):**
1. Fetch payment status directly via payment reference:
   ```bash
   curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:5001/api/payment/reconcile-manual?orderId=ORD-9912
   ```
2. If payment captured but inventory reservation lapsed:
   - System commits stock if available, or initiates automated refund if stock exhausted.

---

### Scenario 6: Application Rollback Procedure

**Trigger:** Production deployment exhibits critical functional regressions or memory leaks.

**Rollback Protocol:**
1. **Container Image Rollback:**
   ```bash
   # Revert Kubernetes / Docker service to previous immutable digest
   docker service update --image trimedi-backend:v5.0-hardened trimedi_api
   ```
2. **Database Schema Compatibility Check:**
   - All schema migrations must be backward-compatible (expand-and-contract pattern).
3. **Health Validation:**
   ```bash
   curl -f http://localhost:5001/health || exit 1
   ```

---

### Scenario 7: Security Incident Recovery (Account Takeover / Ransomware / Malicious Upload)

**Protocol:**
1. **Isolate Affected Accounts:**
   - Execute global session invalidation:
     ```javascript
     invalidateUserSessions(compromisedEmail);
     ```
2. **Quarantine Malicious Uploads:**
   - Inspect `backend/uploads/prescriptions/`.
   - Remove any suspicious files identified by hash:
     ```bash
     rm -f backend/uploads/prescriptions/<quarantined-file-uuid>.*
     ```
3. **Verify File Streaming Access Logs:**
   - Check `SecurityEvent` log for `UNAUTHORIZED_CLINICAL_ACCESS` or `MALICIOUS_UPLOAD_BLOCKED`.
4. **Notify Clinical Risk & Legal Team:**
   - Trigger the 7-stage incident response plan documented in `SECURITY_INCIDENT_RESPONSE.md`.
