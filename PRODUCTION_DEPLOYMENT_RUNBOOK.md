# TriMedi Production Deployment Runbook (Phase 5.9)

**Platform:** TriMedi Intelligent Healthcare Ecosystem  
**Milestone:** Phase 5.9 — Step 22 Production Deployment Runbook  
**Target Environment:** Production Cloud (Node.js LTS, MongoDB Replica Set, Redis Cluster, Vite CDN)  
**Date:** October 17, 2026  
**Document Classification:** Standard Operating Procedure (SOP)  

---

## 1. Pre-Deployment Prerequisites

Before executing a production deployment, DevOps engineers must ensure the following prerequisites are met:

```text
[ ] 1. All automated regression suites pass (206/206 tests, 0 failures).
[ ] 2. Vite production frontend build completes with 0 errors (npm run build).
[ ] 3. Production secrets provisioned in AWS Secrets Manager / Doppler.
[ ] 4. MongoDB Atlas user rotated and old credential deleted.
[ ] 5. PayPal live production credentials configured (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENVIRONMENT=live).
[ ] 6. Production domain DNS configured with TLS 1.3 certificates.
[ ] 7. Dedicated Redis cluster online with password authentication and TLS.
```

---

## 2. Production Environment Variable Specification

| Variable Name | Required Value / Description | Sensitivity |
| :--- | :--- | :---: |
| `NODE_ENV` | `production` | Public |
| `APP_ENV` | `production` | Public |
| `PORT` | `5001` (Internal container port) | Internal |
| `CLIENT_URL` | `https://app.trimedi.health` | Public |
| `JWT_SECRET` | Cryptographically random string ($\ge 32$ chars) | **HIGH** |
| `MONGO_URI` | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/trimedi_production?retryWrites=true&w=majority` | **CRITICAL** |
| `REDIS_URL` | `rediss://:<pwd>@redis.production.trimedi.internal:6379` | **HIGH** |
| `PAYPAL_CLIENT_ID` | Live PayPal REST application Client ID | Public |
| `PAYPAL_CLIENT_SECRET`| Live PayPal application Secret | **CRITICAL** |
| `PAYPAL_ENVIRONMENT` | `live` (Production environment) | Public |
| `PAYPAL_WEBHOOK_ID` | Registered PayPal production webhook ID | **HIGH** |
| `ALLOW_TEST_MOCKS` | `false` (Strictly forbidden in production) | Internal |
| `ALLOW_PILOT_MOCKS` | `false` (Strictly forbidden in production) | Internal |

---

## 3. Step-by-Step Deployment Procedure (Blue/Green Zero-Downtime)

```
                       TRAFFIC ROUTING (CLOUDFLARE / ALB)
                                       ↓
                       +---------------+---------------+
                       ↓                               ↓
               [BLUE ENVIRONMENT]              [GREEN ENVIRONMENT]
               Current Active v5.75            New Deployment v5.9
               Serving Public Traffic          Health Probes Verified
                       ↓                               ↑
                       +<===== SWITCH TRAFFIC =========+
```

### Step 3.1: Prepare Release Artifacts
```bash
# 1. Clone clean main branch
git clone https://github.com/nikamaditya249/TriMedi-Intelligent-Healthcare-Ecosystem.git
cd TriMedi-Intelligent-Healthcare-Ecosystem

# 2. Build Production Frontend Bundle
cd frontend
npm ci
npm run build
# Artifacts produced in frontend/dist/

# 3. Build Production Backend Container
cd ../backend
docker build -t trimedi-backend:v5.9 .
```

### Step 3.2: Launch Staging / Green Container
```bash
# Launch new container instance with production environment injection
docker run -d \
  --name trimedi-green-v5.9 \
  --env-file /etc/trimedi/production.env \
  -p 5002:5001 \
  --restart unless-stopped \
  trimedi-backend:v5.9
```

### Step 3.3: Execute Pre-Flight Health Probes on Green Instance
```bash
# 1. Verify Process Liveness
curl -f http://localhost:5002/live
# Expected: {"status":"ALIVE","uptimeSeconds":...,"timestamp":"..."}

# 2. Verify Database Readiness (Must return 200 READY)
curl -f http://localhost:5002/ready
# Expected: {"status":"READY","mode":"production","database":"connected",...}

# 3. Verify Sanitized Telemetry (Must NOT leak secrets)
curl -f http://localhost:5002/health
# Expected: {"status":"HEALTHY","environment":"production",...}
```

### Step 3.4: Execute Automated Smoke Test against Green Instance
```bash
cd backend
BASE_URL="http://localhost:5002" node scripts/production_smoke_test.js
# Expected output: SMOKE TEST RESULT: 22 / 22 STEPS PASSED (100%)
```

### Step 3.5: Cutover Production Traffic
```bash
# Update reverse proxy / Application Load Balancer to point traffic to Green (Port 5002)
# Once verified, terminate legacy Blue container:
docker stop trimedi-blue-legacy
docker rm trimedi-blue-legacy
```

---

## 4. Post-Deployment Verification Checklist

1. [ ] Check real-time application logs: `docker logs -f trimedi-green-v5.9`.
2. [ ] Verify WebSocket connectivity on `wss://api.trimedi.health/socket.io/`.
3. [ ] Verify payment webhook listener receives incoming PayPal test event ping.
4. [ ] Verify Sentry error monitoring captures zero unhandled exceptions.
5. [ ] Verify CloudWatch / Datadog CPU and memory utilization ($< 40\%$).
6. [ ] Confirm database connection pool latency is $< 10\text{ms}$.

---

## 5. Escalation Contacts & On-Call Schedule

* **Incident Commander:** Principal Platform Architect (+91-98765-XXXXX)
* **Lead Security Engineer:** DevSecOps Lead (security@trimedi.health)
* **Lead Clinical Operations:** Medical Director (clinical@trimedi.health)
* **Database Administrator:** Cloud Infrastructure Team (dba@trimedi.health)
