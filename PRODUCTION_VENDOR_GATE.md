# TriMedi Production Vendor Security & Governance Gate (Phase 5.9)

**Platform:** TriMedi Intelligent Healthcare Ecosystem  
**Milestone:** Phase 5.9 — Step 21 Vendor Gate  
**Compliance Lead:** DevSecOps Lead & Production Compliance Officer  
**Evaluation Date:** October 17, 2026  
**Status:** **GO ON TECHNICAL INTEGRATION / NO-GO ON LIVE EXTERNAL KYC & LEGAL CONTRACTS**  

---

## 1. Vendor Governance Principles

Under Indian digital healthcare standards (Telemedicine Practice Guidelines 2020) and the Digital Personal Data Protection Act (DPDP Act 2023), third-party vendors processing patient health information (PHI) or processing financial payments must be formally evaluated for:
1. **Data Minimization:** No unnecessary patient identifiers transferred to third parties.
2. **Data Residency:** Primary health records stored within Indian sovereign borders (ap-south-1 / Mumbai).
3. **Statutory Certifications:** SOC 2 Type II, ISO 27001, HIPAA, and PCI-DSS compliance.
4. **Data Protection Agreements (DPAs):** Signed bilateral DPAs guaranteeing zero commercial training on patient data.

---

## 2. Third-Party Vendor Register & Audit Matrix

```
+------------------------------------------------------------------------------------------------------------------------------------+
|                                                  TRIMEDI VENDOR SECURITY REGISTER                                                  |
+---------------------+-------------------------+------------------------+-------------------+------------------+--------------------+
| Vendor Name         | Service Purpose         | Data Processed         | Data Residency    | Security Certs   | Production Status  |
+---------------------+-------------------------+------------------------+-------------------+------------------+--------------------+
| MongoDB Atlas       | Primary Healthcare DB   | Encrypted PHI & Orders | AWS Mumbai (27)   | SOC 2, ISO 27001 | AVAILABLE / CREDENTIAL ROTATION REQUIRED |
| PayPal Inc.         | Production Gateway (v2) | Transaction IDs, Orders| Global / USA       | PCI-DSS Level 1  | SANDBOX VERIFIED (LIVE KEYS REQUIRED)     |
| Razorpay Software   | Optional Domestic Gateway| Order IDs, UPI, Cards  | India (RBI-Gov)   | PCI-DSS Level 1  | OPTIONAL SECONDARY (NOT A GO-LIVE BLOCKER) |
| Google Cloud / LLM  | Assistive OCR & AI      | Sanitized Rx Texts     | Global / India    | SOC 2, ISO 27017 | PENDING BAA/DPA    |
| Redis Enterprise    | Distributed Security    | Token Hashes, Counters | AWS Mumbai        | SOC 2, HIPAA     | PROVISIONING       |
| AWS Cloud Hosting   | App Container Hosting   | Ephemeral Docker nodes | ap-south-1 Mumbai | SOC 1/2/3, ISO   | READY FOR DEPLOY   |
| SMS Gateway (GupShup| Critical 2FA & Refills  | Phone Numbers, Tokens  | India (DLT-Reg)   | TRAI Registered  | READY FOR DLT      |
| Blue Dart Pharma    | Cold-Chain Logistics    | Delivery Address, Name | India Domestic    | GxP Compliant    | READY FOR API SYNC |
+---------------------+-------------------------+------------------------+-------------------+------------------+--------------------+
```

---

## 3. Vendor-by-Vendor Evaluation Details

### 3.1 MongoDB Atlas (Cloud Database)
* **Purpose:** Primary durable persistence store for clinical records, prescriptions, and financial audit logs.
* **Security Controls:** TLS 1.3 in-transit encryption, AES-256 at-rest encryption, automated VPC peering, and IP access whitelisting.
* **Cluster Availability:** **AVAILABLE & ACTIVE** (Verified connected in 563ms, admin ping `{ ok: 1 }`, 9 collections, 72 products).
* **Credential Security Blocker:** Historical credential `adityanikams73_db_user` remains active on the cluster and must be deleted via Atlas console (`cloud.mongodb.com`) with new production credential provisioned.  
  *Status:* **`CREDENTIAL SECURITY P0 — CONSOLE DELETION REQUIRED`**

### 3.2 PayPal Inc. (Primary Production Payment Gateway)
* **Purpose:** Primary production payment processing for pharmacy orders, consultation fees, and refunds via PayPal v2 REST APIs.
* **Security Controls:** Server-authoritative GST pricing calculation, concurrency-safe inventory reservation, atomic capture commit, idempotent replay defense on webhooks and captures, strict bounds-checked refunds.
* **Implementation Status:** Code-verified and sandbox-verified (16/16 test suite passed, 22-step smoke test passed).
* **Production Blocker:** Production deployment requires live credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT=live`) and registered production webhook ID.  
  *Status:* **`LIVE CREDENTIALS P1 — PROVISIONING REQUIRED FOR GO-LIVE`**

### 3.3 Razorpay Software Pvt. Ltd. (Optional Secondary Provider)
* **Purpose:** Optional domestic payment provider for UPI/Cards.
* **Status:** De-scoped from mandatory go-live blocker; retained as optional secondary provider abstraction.  
  *Status:* **`OPTIONAL / NON-BLOCKING`**

### 3.3 Google Cloud / Vertex AI (Assistive Clinical OCR)
* **Purpose:** Optical Character Recognition (OCR) and structured drafting of patient-uploaded prescriptions.
* **Safety Controls:** Field-level confidence scores, mandatory quarantine to `draft`, and prompt-injection filtering. Patient names, phones, and government IDs scrubbed prior to transmission.
* **Production Blocker:** Business Associate Agreement (BAA) and Data Processing Agreement (DPA) guaranteeing zero data retention and zero training on clinical prompts required.  
  *Status:* **`LEGAL REVIEW REQUIRED`**

### 3.4 Redis Cloud (Distributed Security Adapter)
* **Purpose:** Multi-container session revocation, cross-device logout invalidation, and sliding-window brute-force rate limiting.
* **Safety Controls:** TLS encryption, password authentication, and automatic fail-safe behavior (never bypasses security on outage).
* **Production Status:** Architecture validated in code; required when horizontally scaling across multiple container replicas.

### 3.5 Logistics & Fulfillment Partners (Blue Dart Express / MedPlus)
* **Purpose:** Physical last-mile delivery of prescription medications.
* **Privacy Controls:** Delivery manifests contain delivery address and recipient phone only. Medical diagnoses and clinical indications strictly omitted from package labels.
* **Production Status:** Ready for shipping API integration.

---

## 4. Vendor Gate Determination

```
================================================================================
FINAL VENDOR GATE DECISION: NO-GO — PRODUCTION BLOCKED
================================================================================
Reasoning:
While technical integration, cryptography, and data minimization controls are
100% verified, production cutover is blocked by:
1. Atlas legacy credential rotation.
2. Razorpay live merchant KYC activation.
3. Healthcare DPA execution with AI inference provider.
================================================================================
```
