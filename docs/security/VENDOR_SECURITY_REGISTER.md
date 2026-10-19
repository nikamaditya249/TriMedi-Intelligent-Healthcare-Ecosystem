# TriMedi Intelligent Healthcare Ecosystem
## Third-Party Vendor Risk Register & Cloud Governance

**Document Reference:** `docs/security/VENDOR_SECURITY_REGISTER.md`  
**Classification:** Vendor Risk Governance  
**Status:** Active Security Register  

---

### 1. Vendor Governance Principles

Every third-party service provider interacting with TriMedi infrastructure or processing patient/financial data must adhere to strict security criteria:
1. **Data Minimization:** Vendors receive only the minimal data elements strictly necessary to execute their contracted function.
2. **Encryption in Transit & at Rest:** Enforced TLS 1.3 in transit and AES-256 at rest.
3. **Data Residency:** All protected health information (PHI) and clinical records must reside within Indian jurisdiction (e.g. AWS Mumbai / Azure Central India).
4. **Contractual Protections:** Signed Data Processing Addendum (DPA) or Business Associate Agreement (BAA) with mandatory $\le 48$-hour breach notification SLAs.

---

### 2. Third-Party Vendor Register

| Vendor Name | Service / Purpose | Data Processed | Classification | Region | Encryption | Retention | DPA / BAA Status | Incident SLA | Production Status |
|---|---|---|---|---|---|---|---|---|---|
| **MongoDB Atlas** | Distributed Database (Replica Set) | Patient profiles, medical consultations, prescriptions, orders | Level 3 & 4 (PHI & SPI) | India (`ap-south-1` Mumbai) | TLS 1.3 / AES-256 (WiredTiger) | Active + 30d PITR snapshots | DPA Available; SOC 2 Type II / ISO 27001 | $\le 24\text{ hours}$ | **ACTIVE (`trimedi_prod`)** |
| **PayPal Inc.** | Online Payment Provider (REST API v2) | Order amounts, transaction tokens, capture IDs | Level 5 (Financial Tokens) | Global / India | TLS 1.3 / PCI-DSS Level 1 | 7 years (Statutory financial ledger) | Master Services Agreement + PCI-DSS certified | $\le 24\text{ hours}$ | **SANDBOX ACTIVE (PROD KYC / LIVE PENDING)** |
| **Google Cloud (Gemini)** | Assistive Prescription Extraction (OCR/NLP) | De-identified clinical notes (PII stripped by TriMedi) | Level 4 (Clinical, Sanitized) | Configurable / Global Cloud | TLS 1.3 / AES-256 | Ephemeral (Zero data retention policy) | BAA / DPA Required for live clinical use | $\le 48\text{ hours}$ | **TECHNICAL PILOT READY (DPA PENDING)** |
| **Redis Cloud / Upstash** | Distributed Security Store (Sessions & Rate Limits) | Revoked JWT tokens, user invalidation timestamps, rate counters | Level 2 (Internal Security) | India (`ap-south-1`) | TLS 1.3 / AES-256 | TTL-based auto-expiry ($15\text{m} - 24\text{h}$) | Standard Cloud DPA; SOC 2 Type II | $\le 24\text{ hours}$ | **PLANNED (PILOT USES IN-MEMORY ADAPTER)** |
| **AWS / DigitalOcean** | Container & Application Hosting | Node.js backend runtime, static assets, reverse proxy | All levels | India (`ap-south-1`) | TLS 1.3 / EBS AES-256 | Ephemeral container state | AWS Enterprise Cloud Agreement | $\le 24\text{ hours}$ | **PILOT READY** |

---

### 3. Vendor Action Items for Full Go-Live

1. **MongoDB Atlas:** Execute console deletion of legacy user `adityanikams73_db_user` in MongoDB Atlas console.
2. **PayPal:** Complete business merchant KYC onboarding, provision Live REST credentials, and register production webhook.
3. **Google Cloud:** Sign enterprise Data Processing Addendum (DPA) for clinical OCR assistance.
4. **Redis:** Provision cloud Redis cluster prior to multi-instance container horizontal autoscaling.
