# TriMedi Intelligent Healthcare Ecosystem
## Standard Production Deployment Runbook

**Document Reference:** `docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md`  
**Classification:** DevOps & Production Operations  
**Status:** Operational Deployment Runbook  

---

### 1. Pre-Deployment Prerequisites

Before initiating public production deployment, ensure that all external release gates are formally satisfied:
1. **Database Access:** Dedicated user `trimedi_prod` active on MongoDB Atlas cluster `cluster0.j4elnei.mongodb.net` with `readWrite` on database `trimedi`.
2. **Legacy User:** Compromised legacy user `adityanikams73_db_user` confirmed deleted in Atlas Cloud Console.
3. **PayPal LIVE:** Live merchant KYC completed; live REST credentials configured (`PAYPAL_ENVIRONMENT=live`).
4. **PayPal LIVE Webhook:** Endpoint `https://api.trimedi.health/api/paypal/webhook` registered in live dashboard.
5. **Legal Sign-Off:** Signed written compliance opinion from qualified healthcare/privacy counsel archived.
6. **JWT Secret:** 64-character high-entropy CSPRNG key generated and injected into host environment.

---

### 2. Environment Variables Configuration (`.env`)

Deploy the production `.env` to the secure server directory (NEVER commit to Git):

```bash
# Server Core
PORT=5001
NODE_ENV=production
APP_ENV=production
CLIENT_URL=https://app.trimedi.health

# Authoritative MongoDB Atlas Connection
MONGO_URI=mongodb+srv://trimedi_prod:<PASSWORD>@cluster0.j4elnei.mongodb.net/trimedi?retryWrites=true&w=majority

# Cryptographic Security (64-char hex key generated via openssl rand -hex 32)
JWT_SECRET=<64_CHAR_HEX_SECRET>

# Sole Online Payment Provider: PayPal REST API v2
PAYPAL_ENVIRONMENT=live
PAYPAL_CLIENT_ID=<LIVE_PAYPAL_CLIENT_ID>
PAYPAL_CLIENT_SECRET=<LIVE_PAYPAL_CLIENT_SECRET>
PAYPAL_WEBHOOK_ID=<LIVE_WEBHOOK_ID>

# Optional Secondary Services
GEMINI_API_KEY=<PRODUCTION_GEMINI_KEY>
REDIS_URL=rediss://default:<PASSWORD>@<REDIS_HOST>:6379

# Bootstrap Admin (Optional initial seed)
BOOTSTRAP_ADMIN_EMAIL=admin@trimedi.health
BOOTSTRAP_ADMIN_PASSWORD=<STRONG_TEMPORARY_PASSWORD>
```

---

### 3. Step-by-Step Deployment Execution

#### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/nikamaditya249/TriMedi-Intelligent-Healthcare-Ecosystem.git
cd TriMedi-Intelligent-Healthcare-Ecosystem
cd backend && npm ci --omit=dev
cd ../frontend && npm ci
```

#### Step 2: Database Initialization & Verification (Non-Destructive)
```bash
cd backend
# 1. Synchronize authoritative collections and indexes
npm run db:init

# 2. Seed the 50-item canonical pharmaceutical catalog (idempotent upserts)
npm run db:seed

# 3. Verify probe CRUD, indexes, and replica set ACID transaction integrity
npm run db:verify
```

#### Step 3: Frontend Build & CDN Deployment
Compile the optimized Vite single-page application:
```bash
cd ../frontend
npm run build
# Deploy dist/ contents to S3, Cloudflare Pages, or Nginx static root
```

#### Step 4: Backend Process Management Startup
Launch the backend service using PM2 or Docker container:
```bash
cd ../backend
pm2 start index.js --name "trimedi-api" -i max --env production
```

#### Step 5: Health & Readiness Verification
Execute container probe assertions:
```bash
# 1. Process Liveness (must return HTTP 200 ALIVE)
curl -f http://localhost:5001/live

# 2. Database Traffic Readiness (must return HTTP 200 READY)
curl -f http://localhost:5001/ready

# 3. Sanitized Component Telemetry (must return HTTP 200 without secret leaks)
curl -f http://localhost:5001/health
```

#### Step 6: Post-Deployment Smoke Test
Run the automated end-to-end smoke test against the live endpoint:
```bash
node scripts/production_smoke_test.js
```
