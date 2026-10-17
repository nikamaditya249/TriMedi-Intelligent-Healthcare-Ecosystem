# TriMedi Platform — Vendor Security & Third-Party Risk Register

**Author:** DevSecOps & Third-Party Vendor Risk Management  
**Date:** October 17, 2026  
**Ecosystem:** TriMedi — Intelligent Healthcare Ecosystem  
**Classification:** Vendor Risk Governance (Level 2)  
**Applicability:** Pilot Deployment & Production Operations  

---

## 1. Vendor Governance Principles

Every third-party service provider interacting with TriMedi infrastructure or processing patient/financial data must adhere to strict security criteria:
1. **Data Minimization:** Vendors receive only the minimal data elements strictly necessary to execute their contracted function.
2. **Encryption in Transit & at Rest:** Enforced TLS 1.3 in transit and AES-256 at rest.
3. **Data Residency:** All protected health information (PHI) and clinical records must reside within Indian jurisdiction (e.g. AWS Mumbai / Azure Central India).
4. **Contractual Protections:** Signed Data Processing Addendum (DPA) or Business Associate Agreement (BAA) with mandatory $\le 48$-hour breach notification SLAs.

---

## 2. Third-Party Vendor Register

| Vendor Name | Service / Purpose | Data Processed | Classification | Region | Encryption | Retention | DPA / BAA Status | Incident SLA | Production Status |
|---|---|---|---|---|---|---|---|---|---|
| **MongoDB Atlas** | Distributed Database (Replica Set) | Patient profiles, medical consultations, prescriptions, orders | Level 3 & 4 (PHI & SPI) | India (`ap-south-1` Mumbai) | TLS 1.3 / AES-256 (WiredTiger) | Active + 30d PITR snapshots | DPA Available; SOC 2 Type II / ISO 27001 | $\le 24\text{ hours}$ | **ACTIVE (ROTATION REQUIRED)** |
| **Razorpay Software** | Payment Gateway & Invoicing (UPI/Cards) | Order amounts, billing name, transaction tokens, GSTIN | Level 5 (Financial Tokens) | India | TLS 1.3 / PCI-DSS Level 1 | 7 years (Statutory financial ledger) | Master Services Agreement + PCI-DSS certified | $\le 24\text{ hours}$ | **SANDBOX ACTIVE (PROD KYC PENDING)** |
| **Google Cloud (Gemini)** | Assistive Prescription Extraction (OCR/NLP) | De-identified clinical notes (PII stripped by TriMedi) | Level 4 (Clinical, Sanitized) | Configurable / Global Cloud | TLS 1.3 / AES-256 | Ephemeral (Zero data retention policy) | BAA / DPA Required for live clinical use | $\le 48\text{ hours}$ | **TECHNICAL PILOT READY (DPA PENDING)** |
| **Redis Cloud / Upstash** | Distributed Security Store (Sessions & Rate Limits) | Revoked JWT tokens, user invalidation timestamps, rate counters | Level 2 (Internal Security) | India (`ap-south-1`) | TLS 1.3 / AES-256 | TTL-based auto-expiry ($15\text{m} - 24\text{h}$) | Standard Cloud DPA; SOC 2 Type II | $\le 24\text{ hours}$ | **PLANNED (PILOT USES IN-MEMORY ADAPTER)** |
| **Twilio / Gupshup** | SMS & WhatsApp Refill Notifications | Patient mobile number, clinic name, appointment reminder | Level 3 (SPI) | India | TLS 1.3 | Message delivery log ($30\text{ days}$) | Telecom DPA / DLT Registration Required | $\le 48\text{ hours}$ | **INTEGRATION PENDING (DLT REGISTRATION)** |
| **SendGrid / AWS SES** | Transactional Email & Password Resets | Patient email address, password reset token links | Level 3 (SPI) | India | TLS 1.3 / DKIM & SPF | Delivery logs ($30\text{ days}$) | DPA Available; SOC 2 Type II | $\le 48\text{ hours}$ | **INTEGRATION PENDING** |
| **AWS / DigitalOcean** | Container & Application Hosting | Node.js backend runtime, static assets, reverse proxy | All levels | India (`ap-south-1`) | TLS 1.3 / EBS AES-256 | Ephemeral container state | AWS BAA / Enterprise Cloud Agreement | $\le 24\text{ hours}$ | **PILOT READY** |
| **Future 3PL Logistics** | Prescription Medicine Delivery | Recipient name, masked delivery address, package tracking | Level 3 (SPI) | Local / Regional | TLS 1.3 | Order fulfillment duration | Logistics DPA & Courier SLA | $\le 24\text{ hours}$ | **PHASE 6 SCOPE** |

---

## 3. High-Priority Vendor Action Items for Pilot Gate

1. **MongoDB Atlas:** Execute manual rotation of connection credentials in the Atlas console to retire `adityanikams73_db_user` and transition to Doppler/AWS Secrets Manager.
2. **Razorpay:** Complete commercial KYC to acquire live production API keys and register production webhook URL.
3. **Google Cloud:** Sign enterprise Data Processing Addendum (DPA) to formally permit assistive OCR processing of prescription images.
4. **Redis:** Provision cloud Redis instance before multi-instance production clustering is activated.
