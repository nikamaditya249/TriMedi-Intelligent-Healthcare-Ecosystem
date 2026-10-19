# TriMedi Intelligent Healthcare Ecosystem
## Production Rollback Runbook

**Document Reference:** `docs/deployment/ROLLBACK_RUNBOOK.md`  
**Classification:** Operational Runbook & Disaster Mitigation  
**Status:** Active Production Runbook  

---

### 1. Rollback Trigger Criteria

A rollback must be initiated immediately if any of the following conditions persist for $> 3\text{ minutes}$ post-deployment:
1. **Health Probes:** `/ready` continuously responds with HTTP 503 `DATABASE_UNAVAILABLE`.
2. **Financial Degradation:** PayPal payment capture error rate exceeds 1% of total transaction volume.
3. **Process Instability:** Fatal unhandled exception loops detected in application logs.
4. **Data Integrity / Security:** Cross-patient IDOR vulnerability, auth bypass, or data integrity defect detected.
5. **Clinical Safety Defect:** Unintended prescription status transition or AI bypassing human-in-the-loop sign-off.

---

### 2. Multi-Layer Rollback Execution Procedures

```
                       ROLLBACK TRIGGERED
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
[ Feature Flags ]     [ Backend / Config ]      [ Frontend / CDN ]
Disable failing       Revert Git commit         Deploy previous
module instantly      Restart PM2 / K8s         static bundle
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                                ▼
                    [ Database State Check ]
                    Non-destructive check:
                    NEVER DROP PRODUCTION DB
```

#### Layer A: Instant Feature Flag Rollback (Zero Downtime)
If an isolated subsystem (e.g., AI prescription extraction, refill prediction, or payment gateway) is defective, disable it instantly without redeploying code:
```bash
# In production environment / secrets manager:
ENABLE_AI_PRESCRIPTION_EXTRACTION=false
ENABLE_REFILL_PREDICTION=false
```
The backend routes immediately gracefully degrade and return user-friendly fallback notices.

#### Layer B: Backend API Rollback
1. **Identify Previous Stable Release Commit:**
   ```bash
   git log --oneline -n 5
   # Example: Commit abc1234 is the verified previous release
   ```
2. **Checkout & Reinstall Dependencies:**
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT_HASH>
   cd backend
   npm ci --omit=dev
   ```
3. **Restart Application Cluster:**
   ```bash
   pm2 restart trimedi-api --update-env
   # Or in Kubernetes:
   # kubectl rollout undo deployment/trimedi-backend
   ```
4. **Validate Health Probes:**
   ```bash
   curl -f http://localhost:5001/live
   curl -f http://localhost:5001/ready
   ```

#### Layer C: Frontend Static Bundle Rollback
If client-side JavaScript bundle errors or UI rendering anomalies occur:
```bash
cd frontend
git checkout <PREVIOUS_STABLE_COMMIT_HASH>
npm ci
npm run build
# Invalidate CDN cache or redeploy dist/ to static host:
# aws s3 sync dist/ s3://trimedi-frontend --delete
# aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

#### Layer D: Configuration & Environment Rollback
If an erroneous environment variable or rotated secret causes failures:
1. Revert `backend/.env` to the verified backup (`.env.backup.<TIMESTAMP>`).
2. Reload application process: `pm2 reload trimedi-api`.
3. Verify `/ready` returns HTTP 200 with database connected.

---

### 3. Database Migration & State Recovery Safety Rules

> [!CAUTION]
> **NEVER EXECUTE `dropDatabase()` OR WIPE COLLECTIONS DURING PRODUCTION TRIAGE.**
> Live clinical records and confirmed PayPal orders must be preserved at all costs.

- **Non-Destructive Invariant:** TriMedi database schemas are backward-compatible. Rolling back code will NOT corrupt existing documents.
- **Rollback of Bad Schema Migration:**
  - If a bad index or schema change was introduced, execute targeted correction scripts (e.g. `dropIndex()`) rather than wiping database collections.
  - In the event of catastrophic data corruption, restore from the latest verified automated snapshot:
    ```bash
    node backend/scripts/backup_restore_drill.js
    ```
  - Verify that all 15 collections maintain 100% SHA-256 match and 0 broken foreign key references.

---

### 4. Post-Rollback Verification & Postmortem

1. **Verify Probes:**
   - `GET /live` -> HTTP 200
   - `GET /ready` -> HTTP 200
2. **Run Smoke Suite:**
   ```bash
   cd backend
   node scripts/production_smoke_test.js
   ```
3. **Run Security Negative Matrix:**
   ```bash
   node scripts/security_negative_matrix_test.js
   ```
4. **Postmortem Mandate:** Assemble incident response team within 24 hours to document root cause, impact timeline, and permanent preventive actions.
