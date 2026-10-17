# TriMedi Intelligent Healthcare Ecosystem
## Standard Production Deployment Runbook
**Phase:** 5.97 — Production Operations  
**Scope:** Zero-Downtime Safe Deployment to Authoritative Production Environment  

---

### 1. Pre-Deployment Prerequisites
Before initiating deployment, ensure that all P0 and P1 blockers listed in [FINAL_GO_LIVE_CHECKLIST.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/FINAL_GO_LIVE_CHECKLIST.md) have been cleared:
1. Rotated MongoDB Atlas password placed into production environment.
2. MongoDB database user verified to possess `readWrite` on database `trimedi`.
3. Live PayPal Client ID & Secret configured with `PAYPAL_ENVIRONMENT=live`.
4. Production-grade `JWT_SECRET` generated (minimum 32 random characters).
5. Frontend domain URL configured in `CLIENT_URL`.

---

### 2. Environment Variables Configuration (`.env`)

Deploy the production `.env` to the secure server directory (do not commit to Git):

```bash
# Server Core
PORT=5001
NODE_ENV=production
APP_ENV=production
CLIENT_URL=https://app.trimedi.health

# Authoritative MongoDB Atlas
MONGO_URI=mongodb+srv://<PROD_USER>:<PROD_ROTATED_PASSWORD>@cluster0.lxxpoyn.mongodb.net/trimedi?retryWrites=true&w=majority

# Cryptographic Security
JWT_SECRET=<64_CHAR_HEX_SECRET_openssl_rand_hex_32>

# Primary Online Payment Provider: PayPal
PAYPAL_ENVIRONMENT=live
PAYPAL_CLIENT_ID=<LIVE_PAYPAL_CLIENT_ID>
PAYPAL_CLIENT_SECRET=<LIVE_PAYPAL_CLIENT_SECRET>

# Optional Secondary Services
GEMINI_API_KEY=<PRODUCTION_GEMINI_KEY>
REDIS_URL=redis://:<REDIS_PASSWORD>@<REDIS_HOST>:6379

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

#### Step 2: Database Initialization & Catalog Seeding (Non-Destructive)
Execute the non-destructive bootstrap scripts against the authoritative database:
```bash
cd backend
# 1. Create collections and synchronize indexes
node scripts/db_init.js

# 2. Seed the 50-item pharmaceutical catalog (idempotent upserts)
node scripts/db_seed.js

# 3. Verify probe CRUD and replica set transaction integrity
node scripts/db_verify.js
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
# 1. Process Liveness (must return 200 ALIVE)
curl -f http://localhost:5001/live

# 2. Database Traffic Readiness (must return 200 READY)
curl -f http://localhost:5001/ready

# 3. Sanitized Component Telemetry
curl -f http://localhost:5001/health
```

#### Step 6: Post-Deployment Smoke Test
Run the automated end-to-end smoke test against the live endpoint:
```bash
node scripts/production_smoke_test.js
```

---

### 4. Emergency Contacts & Escalation
- Infrastructure Lead: DevOps Engineering Team
- Clinical Governance: Chief Medical Officer
- Security Operations: SecOps Escalation Desk
