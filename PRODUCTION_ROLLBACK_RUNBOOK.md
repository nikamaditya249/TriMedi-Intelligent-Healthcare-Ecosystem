# TriMedi Intelligent Healthcare Ecosystem
## Standard Production Rollback Runbook
**Phase:** 5.97 — Production Operations  
**Scope:** Rapid, Safe Rollback with Complete Clinical & Financial Data Preservation  

---

### 1. Rollback Trigger Criteria
A rollback must be initiated immediately if any of the following conditions persist for > 3 minutes post-deployment:
1. Endpoint `/ready` continuously responds with HTTP 503 `DATABASE_UNAVAILABLE`.
2. PayPal payment capture error rate exceeds 1% of total transaction volume.
3. Fatal unhandled exception loops detected in application logs.
4. Data integrity violation or cross-patient IDOR vulnerability detected.
5. Critical medical safety defect (e.g., unintended prescription status transitions).

---

### 2. Immediate Traffic Mitigation (Triage)
Before code or database alterations, prevent corrupt transactions:
```bash
# Set maintenance page or divert load balancer traffic
nginx -s reload # (Switching upstream to maintenance notice)
```

---

### 3. Step-by-Step Backend Rollback

#### Step 1: Identify Previous Stable Release
```bash
cd TriMedi-Intelligent-Healthcare-Ecosystem
git log --oneline -n 5
# Example: commit f4e0e18 is the verified Phase 5.96 baseline
```

#### Step 2: Checkout Previous Release
```bash
git checkout <PREVIOUS_STABLE_COMMIT_HASH>
cd backend
npm ci --omit=dev
```

#### Step 3: Restart Application Processes
```bash
pm2 restart trimedi-api --update-env
```

#### Step 4: Validate Container Health
```bash
curl -f http://localhost:5001/live
curl -f http://localhost:5001/ready
```

---

### 4. Database Recovery Guidelines (Non-Destructive)

> [!CAUTION]
> **NEVER execute `dropDatabase()` or wipe collections during production triage.** 
> Live clinical records and confirmed PayPal orders must be preserved at all costs.

If database state corruption occurred:
1. Refer to the most recent automated snapshot created before deployment (e.g., `staging_backup_<TIMESTAMP>.json`).
2. Run point-in-time recovery drill tool:
   ```bash
   node scripts/backup_restore_drill.js
   ```
3. Verify that all 15 collections maintain 100% SHA-256 match and 0 broken foreign key references.

---

### 5. Frontend Static Bundle Rollback
If the frontend bundle caused client-side rendering errors:
```bash
cd ../frontend
git checkout <PREVIOUS_STABLE_COMMIT_HASH>
npm ci
npm run build
# Synchronize dist/ contents to CDN / static hosting
```

---

### 6. Post-Rollback Incident Procedures
1. Confirm `/ready` returns HTTP 200 `READY`.
2. Run full negative security matrix:
   ```bash
   cd ../backend
   node scripts/security_negative_matrix_test.js
   ```
3. Run smoke test:
   ```bash
   node scripts/production_smoke_test.js
   ```
4. Assemble incident response team for root-cause post-mortem documentation within 24 hours.
