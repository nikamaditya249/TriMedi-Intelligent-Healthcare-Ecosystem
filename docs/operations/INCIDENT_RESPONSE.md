# TriMedi Intelligent Healthcare Ecosystem
## Comprehensive Incident Response & Disaster Recovery Runbook

**Document Reference:** `docs/operations/INCIDENT_RESPONSE.md`  
**Classification:** SRE & Security Incident Response Plan (SIRP)  
**Status:** Active Operational Runbook  

---

### 1. Incident Management Lifecycle

Every incident in the TriMedi ecosystem follows a standardized 6-phase resolution process:

```
┌─────────────┐     ┌─────────────┐     ┌───────────────┐
│ 1. DETECT   │ ──> │ 2. CONTAIN  │ ──> │ 3. INVESTIGATE│
└─────────────┘     └─────────────┘     └───────────────┘
                                                │
┌─────────────┐     ┌─────────────┐     ┌───────┴───────┐
│ 6. POST-    │ <── │ 5. VERIFY   │ <── │ 4. RECOVER    │
│    MORTEM   │     └─────────────┘     └───────────────┘
└─────────────┘
```

1. **Detection:** Automated probe alerts (`/live`, `/ready`), CloudWatch/Datadog monitors, or user reports.
2. **Containment:** Fast mitigation to prevent patient harm, financial loss, or blast radius expansion (e.g. circuit breakers, session invalidation, load balancer throttling).
3. **Investigation:** Correlated forensic inspection of `x-correlation-id`, `ClinicalAudit`, and `SecurityEvent` streams.
4. **Recovery:** Restoring services to a stable, authenticated state.
5. **Verification:** Running automated health probes, smoke suites, and integrity checks before restoring live traffic.
6. **Postmortem:** Blameless root cause analysis (RCA) and preventive action items within 48 hours.

---

### 2. Scenario-Specific Response Runbooks

#### Scenario 1: MongoDB Database Outage
- **Detection:** `/ready` returns HTTP 503 `DATABASE_UNAVAILABLE`; Mongoose `disconnected` event.
- **Containment:** `dbGuard.js` trips automatically, preventing corrupted in-memory writes.
- **Investigation:** Check Atlas Cloud Status; inspect network peering and Atlas IP access lists.
- **Recovery:** Atlas primary node failover occurs automatically. If cluster is unrecoverable, initiate Point-in-Time Restore (PITR) to a fresh cluster.
- **Verification:** Run `npm run db:verify` (15/15 collections, 115 indexes, ACID transactions).
- **Postmortem:** Evaluate connection pooling timeouts and replica set election duration.

#### Scenario 2: Redis Outage / Split-Brain
- **Detection:** `SecurityStore` logs `REDIS_UNAVAILABLE` alert; `/ready` probe emits warning.
- **Containment:** System locks to single-instance mode; blocks auto-scaling horizontally.
- **Investigation:** Check Redis memory consumption, network latency, and connection client limits.
- **Recovery:** Restart Redis service or fail over to read-replica.
- **Verification:** Assert token blacklist sync and rate limiter counters.
- **Postmortem:** Review eviction policies and memory thresholds.

#### Scenario 3: Backend API Outage / Crash Loops
- **Detection:** `/live` probe fails; HTTP 502 Bad Gateway at reverse proxy.
- **Containment:** Traffic diverted to maintenance static page via load balancer.
- **Investigation:** Inspect PM2 / Kubernetes container stderr logs for unhandled rejections.
- **Recovery:** Execute `docs/deployment/ROLLBACK_RUNBOOK.md` to deploy previous stable commit.
- **Verification:** Run `node scripts/production_smoke_test.js` (22/22 steps PASS).
- **Postmortem:** Identify missing input validation or unhandled promise rejection.

#### Scenario 4: PayPal Payment Gateway Outage
- **Detection:** Spike in PayPal capture errors; timeout connecting to `api-m.paypal.com`.
- **Containment:** Orders remain in `PENDING` state; client UI displays "Payment Processing — Please check back shortly".
- **Investigation:** Check PayPal Developer status page and network DNS resolution.
- **Recovery:** Run `ReconciliationService.reconcilePendingPayments()` once PayPal restores connectivity.
- **Verification:** Reconcile all pending order IDs and confirm stock commitments.
- **Postmortem:** Review timeout tolerances and retry backoff parameters.

#### Scenario 5: Assistive AI / Gemini API Outage
- **Detection:** AI prescription extractions timing out or returning HTTP 503.
- **Containment:** Fallback mechanism trips: UI prompts physician to manually enter prescription details.
- **Investigation:** Inspect Gemini API quota, rate limits, and network connectivity.
- **Recovery:** Re-enable OCR feature flag when upstream latency drops below $2000\text{ms}$.
- **Verification:** Submit test prescription image and verify `draft` status extraction.
- **Postmortem:** Ensure clinical workflows never block on AI availability (Assistive Only).

#### Scenario 6: Notification Infrastructure Outage
- **Detection:** Socket.IO client disconnection spikes or SMS gateway failure.
- **Containment:** Notifications queued in memory/database with exponential retry backoff.
- **Investigation:** Inspect WebSocket adapter logs and provider delivery receipts.
- **Recovery:** Flush queued notifications in batches with deduplication keys.
- **Verification:** Verify patient receives appointment reminders without duplicate spam.
- **Postmortem:** Review socket connection heartbeat intervals.

#### Scenario 7: Pharmacy Fulfillment Outage
- **Detection:** Orders accumulating in `ACCEPTED` or `PREPARING` without dispatch updates.
- **Containment:** Notify pharmacy manager; alert clinical support operations.
- **Investigation:** Check pharmacy portal connectivity and stock sync issues.
- **Recovery:** Resume state transitions (`PACKED` → `DISPATCHED` → `DELIVERED`).
- **Verification:** Verify stock decrement accuracy and customer delivery tracking notifications.
- **Postmortem:** Establish SLAs for pharmacy dispatch time.

#### Scenario 8: Security Incident & Credential Compromise
- **Detection:** Anomaly alerts from `securityevents` collection (brute force, IDOR, token tampering).
- **Containment:**
  1. Revoke active JWT tokens globally via `SecurityStore.invalidateUserSessions()`.
  2. Rotate master `JWT_SECRET` in environment variables.
  3. Block offending IP addresses at WAF / Reverse Proxy.
- **Investigation:** Review forensic `ClinicalAudit` logs to determine compromised data scope.
- **Recovery:** Require password resets for affected user accounts; restart API cluster.
- **Verification:** Execute `node scripts/security_negative_matrix_test.js` (20/20 PASS).
- **Postmortem:** File CERT-In incident report within 72 hours if statutory data breach occurred.

#### Scenario 9: Data Integrity Defect / Accidental Mutation
- **Detection:** Referential integrity check detects orphaned prescription or consultation records.
- **Containment:** Freeze affected records with status `FLAGGED_FOR_AUDIT`.
- **Investigation:** Audit SHA-256 chained transaction logs to identify the corrupting operation.
- **Recovery:** Restore affected documents from point-in-time snapshot.
- **Verification:** Run `node scripts/backup_restore_drill.js` referential integrity checks.
- **Postmortem:** Add Mongoose pre-save validation hooks preventing the defect.

#### Scenario 10: Failed Deployment
- **Detection:** Post-deployment smoke test fails; `/ready` probe reports unready.
- **Containment:** Immediately execute `docs/deployment/ROLLBACK_RUNBOOK.md`.
- **Recovery:** Revert git commit, reinstall clean dependencies, reload PM2.
- **Verification:** Run `node scripts/production_smoke_test.js`.
- **Postmortem:** Fix test coverage gaps that permitted defective release.
