# TriMedi Intelligent Healthcare Ecosystem — Privacy Policy

**Document Status:** TECHNICAL / PRODUCT DRAFT ONLY  
**Legal Notice:** LEGAL REVIEW REQUIRED PRIOR TO PUBLIC PUBLICATION  
**Effective Date:** October 17, 2026  
**Policy Version:** 2026.1  

---

## 1. Introduction

TriMedi ("we", "our", or "the Platform") is an intelligent healthcare ecosystem designed to securely connect patients, healthcare providers, licensed retail pharmacies, and clinical workflows.

We are committed to maintaining the highest standards of data privacy, confidentiality, and technical protection for personal and health information. This Privacy Policy explains what information we collect, why we collect it, how it is processed, and your privacy rights.

---

## 2. Information We Collect

### A. Information You Provide
1. **Account Registration:** Name, email address, password (stored as a salted bcrypt hash), mobile phone number, role.
2. **Clinical Demographics:** Date of birth, gender, blood group, emergency contact details, allergies, existing chronic conditions.
3. **Medical & Consultation Data:** Chief complaints, medical histories, prescription uploads, appointment scheduling requests.
4. **Billing & Shipping:** Delivery address, recipient contact phone, GST state preference.

### B. Information Generated Through Healthcare Workflows
1. **Clinical Records:** Doctor examination notes, vitals telemetry, approved digital prescriptions, medication schedules.
2. **Medication Adherence:** Daily dose logs (taken, missed, skipped), supply estimates, refill notifications.
3. **Commerce & Orders:** Server-authoritative order invoices, fulfillment status, transaction identifiers (Razorpay payment ID, PayPal capture ID).
4. **Technical & Audit Data:** Append-only clinical audit entries, IP address, user agent, browser session timestamps.

---

## 3. How We Use Your Information

We process personal and health data strictly for the following purposes:
- **Clinical Treatment & Consultations:** Facilitating appointments, clinical examinations, and doctor prescription issuance.
- **Pharmacy Fulfillment:** Transmitting doctor-approved prescription items and delivery addresses to pharmacies for dispensing.
- **Medication Safety & Adherence:** Generating schedule reminders, calculating drug supply timelines, and flagging known contraindications.
- **Platform Security & Fraud Defense:** Cryptographically verifying payments, preventing unauthorized access (IDOR defense), and maintaining immutable clinical audit trails.

> [!IMPORTANT]
> **No Unbundled Consent:** Clinical care consent is strictly separated from optional marketing communications. Withdrawing optional marketing or SMS notifications does NOT affect your medical care or access to prescriptions.

---

## 4. How We Share Your Information

We do not sell, rent, or monetize your health information. Data is shared strictly on a **need-to-know, least-privilege basis**:
- **With Your Treating Doctor:** Full access to your consultation history, vitals, and longitudinal care timeline.
- **With Dispensing Pharmacies:** Only the medicines, dosages, and quantities required for prescription fulfillment. Pharmacies are **strictly blocked** from viewing your diagnosis or doctor notes.
- **With Reception Desks:** Only operational scheduling metadata (name, appointment time, queue token). Reception is **strictly blocked** from viewing clinical diagnosis or prescription items.
- **With External Payment Gateways:** Authoritative transaction amounts and order IDs transmitted via TLS to Razorpay/PayPal. We do not store raw credit card numbers or banking passwords.
- **With External AI Processors:** De-identified prescription text transmitted to Google Gemini for assistive extraction. Identifiers (email, phone, address) are stripped prior to transmission.

---

## 5. Security & Technical Safeguards

- **Encryption in Transit:** All network communication is enforced via TLS 1.3 / HTTPS.
- **Encryption at Rest:** Sensitive health records and databases are protected using AES-256 encryption.
- **Access Control:** Role-Based Access Control (RBAC), multi-factor step-up authentication on sensitive operations, and session revocation.
- **File Security:** Uploaded prescription documents are stored outside the public web root with randomized UUID filenames and served only through authenticated routes.

---

## 6. Your Rights & Privacy Controls

Through the TriMedi Privacy & Trust Settings dashboard, you have the right to:
1. **Access Your Health Data:** View and download your complete longitudinal medical timeline.
2. **Export Your Records:** Request an authenticated, structured export of your personal health data.
3. **Manage Consents:** Review active consent grants and revoke optional consents (e.g. AI assistance, marketing notifications) at any time.
4. **Request Account Deletion:** Request closure and anonymization of your account, subject to mandatory healthcare statutory record retention requirements.

---

## 7. Data Retention Policy

- **Active Clinical Records:** Maintained throughout the duration of your active care relationship.
- **Statutory Retention:** Medical prescriptions and consultation notes may be retained for legally mandated medical record retention periods even following account deactivation.
- **Non-Clinical Data:** Marketing preferences and notification caches are deleted immediately upon request.

---

## 8. Contact & Data Protection Officer

For privacy inquiries, consent management support, or to exercise your privacy rights:  
**Data Protection Officer (DPO):** `privacy@trimedi.health`  
**Security Operations Team:** `security@trimedi.health`
