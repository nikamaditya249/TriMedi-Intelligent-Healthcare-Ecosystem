# TriMedi Intelligent Healthcare Ecosystem — Data Classification & Privacy Governance

**Document Version:** 1.0.0 (Phase 5 Privacy Architecture)  
**Classification Authority:** Senior Healthcare Privacy & Information Security Team  
**Date:** October 17, 2026  

---

## 1. Purpose & Scope

This Data Classification Policy establishes a mandatory schema for categorizing all electronic health information, personal identifiers, operational records, and financial secrets processed by the TriMedi Intelligent Healthcare Ecosystem.

The objective is to enforce **least-privilege access, data minimization, cryptographic protection, and defensible retention rules** aligned with real-world healthcare compliance engineering.

---

## 2. Classification Tiers

| Classification Level | Definition | Examples in TriMedi | Impact of Breach |
|---|---|---|---|
| **PUBLIC** | Information intended for public consumption with zero confidentiality requirements. | Medicine catalog prices, brand names, OTC descriptions, clinic address, working hours. | Negligible (Public marketing data). |
| **INTERNAL** | Non-public operational data used for clinic and pharmacy administration. Does not contain clinical patient data. | Live queue token counters, stock threshold alerts, operational shift schedules, batch inventory counts. | Low to Moderate (Operational disruption). |
| **SENSITIVE** | Personally Identifiable Information (PII) identifying patients or staff, without clinical diagnostic records. | Full name, phone number, email address, physical delivery address, date of birth, emergency contact. | Moderate to High (Identity theft, privacy violation). |
| **HIGHLY_SENSITIVE_CLINICAL** | Protected Health Information (PHI) containing medical conditions, clinical consultations, diagnoses, and treatments. | Medical diagnoses, consultation examination notes, vitals telemetry, approved digital prescriptions, medication adherence history, allergy lists, uploaded prescription images, clinical audit ledgers. | **Critical / Severe** (Medical privacy violation, patient harm, regulatory penalties). |
| **FINANCIAL_SECRET** | Cryptographic secrets, payment credentials, and internal authentication infrastructure. | JWT signing secrets, Razorpay API key secrets, Razorpay webhook secrets, bcrypt password hashes, database connection URIs. | **Critical / Systemic** (Full platform compromise, financial fraud). |

---

## 3. Data Classification Details & Access Controls

### 3.1. PUBLIC
- **Data Elements:** Catalog products (`/api/products`), medicine formulations, public clinic locations, doctor specialties.
- **Access Rule:** Open to unauthenticated clients. Read-only.
- **Storage & Transit:** Cached in memory / database; served over HTTPS.
- **Data Minimization:** No patient or operational data mixed in public catalog responses.

### 3.2. INTERNAL
- **Data Elements:** Pharmacy low-stock alerts, queue token sequence, staff shift schedules.
- **Access Rule:** Restricted to authenticated staff roles (`pharmacy`, `reception`, `doctor`, `admin`).
- **Storage & Transit:** TLS 1.3 in transit; encrypted at rest.
- **Data Minimization:** Stripped of all patient clinical information.

### 3.3. SENSITIVE (PII)
- **Data Elements:** Patient demographics, delivery shipping address, appointment date/time slot, phone number.
- **Access Rule:**
  - Patient: Can access and update own demographic profile.
  - Doctor: Can view patient name and contact for assigned appointments.
  - Reception: Can view patient name and phone for check-in and queue management.
  - Pharmacy: Can view delivery address and contact for order fulfillment only.
- **Storage & Transit:** Encrypted in transit (TLS); database encrypted at rest (AES-256).
- **Audit Requirement:** Queried and updated events logged in audit ledger.

### 3.4. HIGHLY_SENSITIVE_CLINICAL (PHI)
- **Data Elements:**
  - Clinical examination notes & chief complaints (`Consultation.clinicalNotes`, `Consultation.vitals`)
  - Diagnoses & medical conditions (`Consultation.diagnosis`, `User.allergies`, `User.existingConditions`)
  - Prescription medication items, dosages, instructions (`Prescription.items`, `Medication`)
  - Uploaded prescription images/PDFs (`/uploads/prescriptions/*`)
  - Longitudinal care timeline (`/api/consultations/patient-record`)
- **Access Rule:**
  - **Patient:** Strict read-only access to own medical records. Forbidden from viewing other patients' records (IDOR defense).
  - **Doctor:** Full access to clinical encounter, diagnosis, and prescription management for legitimate clinical consultations.
  - **Reception:** **STRICTLY FORBIDDEN (HTTP 403)**. Receptionist endpoints project only operational data (name, appointment time, queue number) with diagnosis and notes completely omitted.
  - **Pharmacy:** Dispensing-required medication details only (medicine name, dosage, quantity). **STRICTLY FORBIDDEN (HTTP 403)** from viewing diagnosis, doctor consultation notes, or unrelated medical history.
  - **Admin:** Operational and audit governance only. Unrestricted browsing of private clinical records requires **Break-Glass Emergency Protocol** with explicit justification.
- **Storage & Transit:** Encrypted in transit (TLS 1.3); database at rest (AES-256); uploaded files stored outside web root with randomized UUID names.
- **Data Minimization:** APIs filter out diagnosis and clinical notes when serving non-clinical roles. External AI extraction minimizes data by stripping PII (email, phone, address) prior to sending text to LLM.

### 3.5. FINANCIAL_SECRET
- **Data Elements:** `JWT_SECRET`, `MONGO_URI`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, user bcrypt password hashes, reset tokens.
- **Access Rule:** System internal services only. Never exposed through any API response or client bundle.
- **Storage & Transit:** Stored in secure environment variables / secret vaults. Passwords hashed using bcrypt (10 rounds). Webhook secrets validated via constant-time HMAC comparison.
- **Logging Rule:** **STRICTLY FORBIDDEN** from being written to application logs, audit trails, or error responses. Sanitized automatically by `logClinicalAudit`.

---

## 4. Role-Based Access Matrix by Classification Tier

| Role | PUBLIC | INTERNAL | SENSITIVE (PII) | HIGHLY_SENSITIVE_CLINICAL | FINANCIAL_SECRET |
|---|:---:|:---:|:---:|:---:|:---:|
| **Anonymous / Public** | Read-Only | Denied (401) | Denied (401) | Denied (401) | Denied (401) |
| **Patient** | Read-Only | Denied (403) | Self-Only | Self-Only (Read-Only) | Denied (403) |
| **Doctor** | Read-Only | Read-Only | Assigned Patients | Full Clinical Authority | Denied (403) |
| **Reception** | Read-Only | Operational | Operational Contacts | **BLOCKED (403)** | Denied (403) |
| **Pharmacy** | Read-Only | Inventory / Queue | Shipping Address | **Dispensing Items Only (No Diag)** | Denied (403) |
| **System Admin** | Read-Only | Full Access | Full Access | **Break-Glass Audited Only** | Managed via Vault |

---

## 5. Data Retention & Lifecycle Rules

1. **Active Records:** Clinical records remain accessible during active treatment and care cycles.
2. **Archived Clinical Records:** Upon patient deletion request or account closure, medical records are shifted to `RETAINED_FOR_LEGAL_COMPLIANCE` status to satisfy statutory medical record retention obligations (subject to external legal/regulatory guidelines). Non-clinical marketing data is deleted immediately.
3. **Prescription Uploads:** Prescription scans and OCR candidate files are retained for clinical verification and audit trail, accessible strictly through authorized signed routes.
4. **Audit Logs:** Clinical and security audit logs are append-only and cannot be altered or purged by application users.
