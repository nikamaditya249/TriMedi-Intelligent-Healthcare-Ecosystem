# TriMedi Production Rollback Runbook (Phase 5.9)

**Platform:** TriMedi Intelligent Healthcare Ecosystem  
**Milestone:** Phase 5.9 — Step 22 Production Rollback Runbook  
**Target Environment:** Production Cloud (Containerized Micro-Services & Reverse Proxy)  
**Date:** October 17, 2026  
**Document Classification:** Emergency Standard Operating Procedure (Emergency SOP)  

---

## 1. Rollback Trigger Criteria

An immediate, emergency rollback to the previous validated platform version must be initiated by the Incident Commander if any of the following P0 trigger conditions occur within 60 minutes of production deployment:

```text
================================================================================
CRITICAL P0 ROLLBACK TRIGGERS:
================================================================================
1. CLINICAL SAFETY FAILURE: Prescriptions issued or approved without doctor verification.
2. FINANCIAL INTEGRITY FAILURE: Orders processed without payment verification or price tampering.
3. SECURITY COMPROMISE: IDOR cross-patient data exposure or authentication bypass detected.
4. AVAILABILITY OUTAGE: Database connection failure causing API error rate > 5% for > 2 minutes.
5. CORRUPTED DEPLOYMENT: Application crash-looping or unhandled exceptions on primary health routes.
================================================================================
```

---

## 2. Emergency 3-Phase Rollback Workflow

```
                               P0 INCIDENT TRIGGERED
                                         ↓
                     [PHASE 1: IMMEDIATE TRAFFIC REROUTING]
                     - Revert ALB / Cloudflare to Previous Blue Container
                     - Cutover time: < 30 seconds
                                         ↓
                     [PHASE 2: DATABASE AUDIT & STATE RECONCILIATION]
                     - Assess data written during failed deployment
                     - Execute Point-in-Time Recovery if schema was corrupted
                                         ↓
                     [PHASE 3: INCIDENT CONTAINMENT & POST-MORTEM]
                     - Revoke compromised tokens
                     - Notify clinical and pharmacy on-call personnel
```

---

## 3. Step-by-Step Rollback Execution

### Step 3.1: Instant Reverse Proxy Traffic Reversion
```bash
# 1. Immediately switch load balancer upstream to previous stable container
# (e.g., Nginx upstream or Cloudflare load balancer pool)
sudo sed -i 's/5002/5001/g' /etc/nginx/sites-available/trimedi.conf
sudo nginx -s reload

# 2. Verify traffic is hitting previous stable container
curl -f https://api.trimedi.health/live
```

### Step 3.2: Stop and Isolate Faulty Green Instance
```bash
# Gracefully stop the faulty instance without losing container logs for post-mortem
docker stop trimedi-green-v5.9
docker logs trimedi-green-v5.9 > /var/log/trimedi/incident_crash_$(date +%s).log
```

### Step 3.3: Database State Assessment & Point-in-Time Recovery
If the database schema or data was corrupted during the failed deployment window:
```bash
# 1. Stop write traffic by placing application in maintenance mode if necessary
export APP_MAINTENANCE_MODE=true

# 2. Trigger Point-in-Time Recovery (PITR) in MongoDB Atlas Cloud Console:
# Navigate to Atlas -> Cluster -> Backup -> Restore -> Point in Time
# Select timestamp 1 minute prior to deployment start time.

# 3. Alternatively, restore from Staging/Pilot Snapshot:
cd /var/backups/trimedi
node /app/backend/scripts/backup_restore_drill.js --restore-latest
```

### Step 3.4: Invalidate Active Tokens & Clear Redis Cache
```bash
# Invalidate ephemeral sessions to prevent replay of corrupted tokens
# In Redis CLI:
redis-cli -u $REDIS_URL FLUSHDB
```

---

## 4. Clinical & Stakeholder Communication Protocol

1. **Internal Notification ($T + 5\text{ min}$):**
   Broadcast emergency update to the `#incident-response` and `#clinic-operations` Slack/Teams channels.
2. **Clinical On-Call Desk ($T + 10\text{ min}$):**
   Notify hospital reception and on-duty doctors that consultation workspaces have been rolled back and patient queue state has been restored.
3. **Pharmacy Fulfillment Desk ($T + 15\text{ min}$):**
   Notify pharmacists to pause packing orders created during the incident window until automated payment and inventory reconciliation completes.

---

## 5. Post-Rollback Forensics & Root Cause Analysis (RCA)

1. Preserve application logs, Docker inspect output, and reverse proxy access logs.
2. Conduct a formal Blameless Root Cause Analysis (RCA) within 24 hours.
3. Document discovered bugs, commit fixes, and add regression test cases before attempting re-deployment.
