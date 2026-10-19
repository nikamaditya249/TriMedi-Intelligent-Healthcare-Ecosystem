# TriMedi Healthcare Platform — Legal & Compliance Governance Review Checklist

**Author:** Healthcare Privacy & Regulatory Compliance Advisory  
**Date:** October 17, 2026  
**Ecosystem:** TriMedi — Intelligent Healthcare Ecosystem  
**Classification:** Legal & Regulatory Governance Checklist  
**Target Milestone:** Controlled Pilot Deployment Gate  

> [!IMPORTANT]
> **Legal Notice:** This document constitutes a technical and operational compliance checklist prepared for legal counsel. TriMedi **does not claim statutory certification or full legal compliance** until independent statutory, organizational, and contractual reviews are completed by licensed legal counsel.

---

## 1. Compliance Domain Review Matrix

| Checklist Item # | Regulatory Domain / Requirement | Technical Control Implemented in TriMedi | Legal Review Status | Reviewer Notes |
|---|---|---|---|---|
| **L-01** | **Digital Personal Data Protection (DPDP) Act — Data Fiduciary Classification** | TriMedi determines purpose & means of clinical patient processing; clinic acts as fiduciary. | **IN REVIEW** | Legal counsel to formalize Data Fiduciary Agreement between TriMedi and pilot clinics. |
| **L-02** | **Granular & Versioned Patient Consent** | Implemented `Consent.js` with versioning, timestamps, and purpose limitation (`AI`, `SMS`, `CARE`). | **IN REVIEW** | Notice format to be validated under DPDP Consent Architecture rules. |
| **L-03** | **Selective Consent Withdrawal Mechanism** | Optional consents can be revoked via `/api/consent/revoke`; mandatory clinical care protected mid-treatment. | **IN REVIEW** | Counsel to confirm permissible exceptions for ongoing acute clinical care. |
| **L-04** | **Right to Access & Data Portability** | Export endpoint `/api/privacy/export` outputs structured, machine-readable JSON health bundle. | **APPROVED** | Verified zero leakage of password hashes or internal security tokens. |
| **L-05** | **Clinical Health Record Retention Mandate** | Clinical records retained $\ge 7\text{ years}$; erasure requests transition to `RETAINED_FOR_LEGAL_COMPLIANCE`. | **APPROVED** | Aligned with statutory Indian Medical Council & National Medical Commission rules. |
| **L-06** | **Mandatory 72-Hour Data Breach Notification** | Incident framework in `SECURITY_INCIDENT_RESPONSE.md` mandates notification to CERT-In and Data Protection Board. | **IN REVIEW** | Incident communication templates require formal legal sign-off. |
| **L-07** | **Cross-Border Health Data Restrictions** | Production MongoDB cluster and application containers must reside in India (e.g. AWS `ap-south-1` Mumbai). | **OPEN** | Cloud infrastructure configuration verification pending before pilot launch. |
| **L-08** | **AI Assistive Clinical Positioning** | Strict human-in-the-loop: AI extractions remain `DRAFT`; prescriptions require physician cryptographic approval. | **APPROVED** | Codified in `MEDICAL_AI_DISCLAIMER.md`. AI is not an autonomous practitioner. |
| **L-09** | **External AI Provider Data Processing (Gemini BAA/DPA)** | De-identified clinical input sanitized via `sanitizeClinicalInputForAI`; external LLM DPA pending. | **OPEN** | Enterprise DPA / Business Associate Agreement required with Google Cloud before sending live PHI. |
| **L-10** | **Payment Data Protection & Non-Storage** | Card numbers and CVVs never touch TriMedi servers; processed directly by Razorpay/PayPal PCI-DSS infrastructure. | **APPROVED** | Technical architecture verified: only server-authoritative tokenized references stored. |
| **L-11** | **Telemedicine Practice Guidelines Alignment** | Digital consultations record vitals, chief complaint, formal doctor registration number, and clinic name. | **IN REVIEW** | Aligned with Telemedicine Practice Guidelines issued by Ministry of Health & Family Welfare. |
| **L-12** | **Pharmacy Dispensing & Drug Schedule Regulations** | Prescription validation verifies active physician approval before permitting checkout of Schedule H/X medicines. | **IN REVIEW** | Dispensing license and pharmacy merchant onboarding verification pending. |
| **L-13** | **Terms of Service & Limitation of Liability** | Technical draft `TERMS_OF_SERVICE.md` created with medical emergency disclaimer (calling 112/911). | **IN REVIEW** | Formal corporate legal review required before public publishing. |
| **L-14** | **Privacy Policy Technical Draft** | Technical draft `PRIVACY_POLICY.md` specifies 5 data tiers, purpose limitations, and security safeguards. | **IN REVIEW** | Formal corporate legal review required before public publishing. |

---

## 2. Status Summary

- **Total Checklist Items:** 14
- **APPROVED (Technical Controls Verified):** 4 items (28.6%)
- **IN REVIEW (Legal Counsel Sign-Off Pending):** 8 items (57.1%)
- **OPEN (External Contractual / Cloud Prerequisite):** 2 items (14.3%)
- **NOT APPLICABLE:** 0 items (0%)

---

## 3. Required Legal Sign-Off Gate for Production Launch

Before moving from **Controlled Pilot** to **General Commercial Production**, the following milestones must transition to `APPROVED`:
1. Execute formal legal review of [PRIVACY_POLICY.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/PRIVACY_POLICY.md) and [TERMS_OF_SERVICE.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/TERMS_OF_SERVICE.md).
2. Execute Data Processing Addendum (DPA) with Cloud LLM provider (Google Cloud / Gemini).
3. Validate pilot hospital/clinic agreement designating TriMedi as clinical data processor/fiduciary.
