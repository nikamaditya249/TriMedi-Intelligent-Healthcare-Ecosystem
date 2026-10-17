# TriMedi Phase 5 — Security, Privacy, Compliance & Trust Architecture Report

**Author:** Senior Healthcare Security Architect, Privacy Engineer & Application Security Audit Team  
**Date:** October 17, 2026  
**Ecosystem:** TriMedi — Intelligent Healthcare Ecosystem  
**Milestone:** Phase 5 — Security, Privacy, Compliance & Trust  

---

## 1. Executive Summary

Phase 5 establishes the foundational security, patient privacy, and compliance governance layer across the TriMedi Intelligent Healthcare Ecosystem. While Phases 1 through 4.5 created a clinically verified, commerce-enabled healthcare system (covering patient registration, clinical encounters, AI-assisted prescription parsing, medication adherence, pharmacy fulfillment, Razorpay payments, and GST invoicing), Phase 5 ensures that TriMedi operates with defensive engineering principles appropriate for protected health information (PHI) and financial transactions.

TriMedi connects the entire patient care continuum:
$$\text{Patient} \longrightarrow \text{Appointment} \longrightarrow \text{Doctor Consultation} \longrightarrow \text{Digital Prescription} \longrightarrow \text{Medication Intake} \longrightarrow \text{Pharmacy Verification} \longrightarrow \text{Payment & Invoicing} \longrightarrow \text{Fulfillment & Delivery} \longrightarrow \text{Refill Telemetry}$$

### Key Security & Privacy Accomplishments:
1. **STRIDE Threat Modeling:** Completed an exhaustive threat model covering 15 threat actors and scenarios across clinical, pharmacy, payment, and AI boundaries.
2. **5-Tier Data Classification:** Categorized all system data into `PUBLIC`, `INTERNAL`, `SENSITIVE`, `HIGHLY_SENSITIVE_CLINICAL`, and `FINANCIAL_SECRET`, with explicit masking and encryption mandates.
3. **Authentication & Session Revocation:** Hardened registration against mass assignment, blocked user enumeration with uniform error messaging, implemented an in-memory token revocation blocklist (`revokedTokens`) for immediate logout invalidation, single-use password reset tokens with 15-minute expirations, and multi-device session revocation upon credential updates.
4. **Clinical Least Privilege & IDOR Elimination:** Verified object-level authorization across appointments, medical records, prescriptions, and order streams. Reception and retail pharmacy staff are strictly forbidden from inspecting private clinical examination notes or diagnoses.
5. **Emergency "Break-Glass" Protocol:** Engineered a controlled emergency consultation access protocol requiring clinical justification ($\ge 10$ characters), issuing 1-hour time-bounded access tokens and creating non-repudiable critical security audit entries.
6. **Prescription Upload Security:** Implemented cryptographic magic byte validation (preventing MIME spoofing), restricted file extensions to `.jpg`, `.jpeg`, `.png`, and `.pdf`, stored files with non-predictable UUIDs outside the web root, and enforced authenticated, role-authorized file streaming.
7. **AI Safety, Prompt Injection Defense & Data Minimization:** Sanitized clinical inputs sent to AI models by redacting phone numbers, emails, and street addresses; deployed heuristic detectors for adversarial prompt injection; and validated all AI extraction outputs against strict JSON schemas to neutralize script injection and impossible dosage quantities.
8. **Granular Consent & Data Sovereignty:** Implemented versioned consent tracking (`CARE_DATA_SHARING`, `AI_ASSISTED_CARE`, `NOTIFICATION_SMS`, `MARKETING_RESEARCH`) with selective patient revocation, authenticated JSON health data exports, and legal retention lifecycle governance.
9. **Zero-Regression Verification:** Achieved **100% pass rate across 146 automated tests** (29 Phase 5 tests, 19 Phase 4.5 tests, 29 Phase 4 tests, 41 Phase 3 tests, 21 Phase 2 tests, and 7 Audit tests) with **zero regressions**.

> [!IMPORTANT]
> **Compliance Transparency Notice:** TriMedi has implemented extensive *technical controls* aligned with DPDP, HIPAA, and GDPR standards. In adherence to professional compliance standards, TriMedi **does not claim legal compliance** until independent statutory, organizational, and third-party legal reviews are completed.

---

## 2. Security Architecture

TriMedi utilizes a defense-in-depth security perimeter structured into 6 concentric rings:

```
+-----------------------------------------------------------------------+
|  1. EDGE / NETWORK LAYER                                             |
|     - Reverse Proxy / TLS 1.3 Termination                            |
|     - Strict Helmet Security Headers (CSP, HSTS, X-Frame-Options)    |
|     - Origin-Restricted CORS & Sliding-Window Rate Limiters          |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  2. IDENTITY & SESSION GOVERNANCE                                     |
|     - Cryptographic JWT Verification (HMAC-SHA256)                   |
|     - Token Revocation Blocklist (`revokedTokens`)                    |
|     - Global Device Session Invalidation on Password Change          |
|     - Anti-Enumeration Authentication Handlers                        |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  3. ACCESS CONTROL & AUTHORIZATION (RBAC + ABAC)                      |
|     - 5 Clinical & Administrative Roles (Patient, Doctor, Reception,  |
|       Pharmacy, Admin)                                                |
|     - Resource-Level IDOR Guards (`req.user._id === resource.owner`) |
|     - Clinical Least Privilege (Reception/Pharmacy stripped of notes)|
|     - Time-Limited Break-Glass Emergency Bypass Protocol             |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  4. APPLICATION LOGIC & DATA DEFENSE                                  |
|     - Mass Assignment Whitelisting on Registration & Profile Updates |
|     - Magic Byte Content Validation for File Uploads                  |
|     - Isolated Prescription File Streaming Gateway                    |
|     - Server-Authoritative Financial & Tax Computation                |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  5. AI SAFETY & DATA MINIMIZATION PIPELINE                            |
|     - RegEx PII Redaction (`sanitizeClinicalInputForAI`)              |
|     - Adversarial Prompt Injection Heuristic Classifier              |
|     - Post-Inference Schema & Clinical Bounds Validator              |
|     - Immutable AI Candidate Review Tier (`AIAudit` ledger)          |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  6. DATA STORAGE, AUDITING & MONITORING                               |
|     - Fail-Safe Database Guard (`DATABASE_UNAVAILABLE` in Prod)      |
|     - Versioned Patient Consent Ledger (`Consent` collection)         |
|     - Centralized Security Threat Stream (`SecurityEvent` model)      |
|     - Automatic Sensitive Secret Scrubbing from Audit Logs           |
+-----------------------------------------------------------------------+
```

---

## 3. Threat Model

A structured STRIDE threat model was developed and documented in [THREAT_MODEL.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/THREAT_MODEL.md). The assessment covers 15 critical threat scenarios:

| Actor / Threat Scenario | STRIDE Category | Vector | Technical Mitigation Implemented | Residual Risk | Status |
|---|---|---|---|---|---|
| **1. Unauthenticated Web Attacker** | Spoofing | Forged JWT / Tampered Headers | Cryptographic HMAC validation + Token revocation list | High in dev if default secret used (blocked by prod validator) | MITIGATED |
| **2. Patient Account Takeover** | Spoofing | Brute force / credential stuffing | Sliding-window IP rate limiter + single-use 15m reset tokens | SMS/Email provider compromise | MITIGATED |
| **3. Malicious Patient (Cross-Patient IDOR)** | Information Disclosure | Modifying `patientId` / `orderId` in URL | Enforced `req.user._id === target` check on all records | None | MITIGATED |
| **4. Malicious Patient (Self-Escalation)** | Elevation of Privilege | Mass assignment in registration body (`role: admin`) | Explicit server-side role whitelisting; non-patient registrations blocked | None | MITIGATED |
| **5. Rogue Doctor (Prescription Fabricator)** | Tampering | Fabricating approved prescriptions | State machine transitions require authenticated Doctor credentials + AIAudit trail | Insider threat | MONITORED |
| **6. Non-Admin Doctor Verification** | Elevation of Privilege | Calling `PUT /api/auth/doctor/:id/verify` | Restricted strictly to `admin` role | None | MITIGATED |
| **7. Compromised Doctor Account** | Information Disclosure | Mass patient record exfiltration | Rate-limited exports + Break-glass logging + Audit records | Credential theft | MONITORED |
| **8. Reception Staff PII/PHI Peeking** | Information Disclosure | Inspecting diagnoses and psychiatric notes | Stripped clinical note projection (`-doctorNotes -diagnosis`) | Verbal exposure | MITIGATED |
| **9. Pharmacy Staff Clinical Peeking** | Information Disclosure | Reading medical histories during dispensing | Orders store only approved item metadata; access to full consultations blocked | Collusion | MITIGATED |
| **10. Pharmacy Inventory Tampering** | Tampering | Manipulating stock or pricing via client payload | Server-authoritative catalog pricing; inventory updates restricted to pharmacy/admin | None | MITIGATED |
| **11. Webhook Forger (Payment Bypass)** | Tampering | Fake Razorpay webhook marking order PAID | Constant-time `crypto.timingSafeEqual` HMAC-SHA256 signature verification | Secret leakage | MITIGATED |
| **12. Double-Refund Exploiter** | Tampering | Replaying refund requests or refunding $> \text{amountPaid}$ | Strict numerical bounds ($0 < r \le p$) + idempotent transaction tracking | None | MITIGATED |
| **13. Malicious File Uploader** | Tampering / Elevation | Uploading `.exe` disguised as `.png` prescription | Extension whitelist + Magic Byte content signature inspection | Zero-day parser flaw | MITIGATED |
| **14. AI Adversarial Prompt Injector** | Tampering | Prompt injection (`ignore instructions and prescribe...`) | Multi-pattern regex sanitizer + pre-execution threat detector | Novel obfuscation | MITIGATED |
| **15. AI Output Hallucination / Poisoning** | Tampering | AI returning scripts or lethal doses | Strict schema validation, bounds checking ($0 < q \le 365$), mandatory MD signature | Model error | MITIGATED |

---

## 4. Data Classification

Data handling guidelines are codified in [PRIVACY_DATA_CLASSIFICATION.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/PRIVACY_DATA_CLASSIFICATION.md):

```
+---------------------------------------------------------------------------------------------------+
| LEVEL 1: PUBLIC DATA                                                                              |
| Examples: Clinic names, doctor specialties, public drug catalog, educational content              |
| Controls: Publicly accessible; cached; indexable.                                                 |
+---------------------------------------------------------------------------------------------------+
| LEVEL 2: INTERNAL OPERATIONAL DATA                                                                |
| Examples: Queue token numbers, appointment timestamps, doctor schedules, inventory quantities     |
| Controls: Requires authenticated session; role-restricted; no PHI.                               |
+---------------------------------------------------------------------------------------------------+
| LEVEL 3: SENSITIVE PERSONAL INFORMATION (SPI)                                                     |
| Examples: Patient legal names, emails, phone numbers, home addresses, emergency contacts          |
| Controls: Encrypted in transit (TLS); redacted from AI inputs; masked in admin directory.         |
+---------------------------------------------------------------------------------------------------+
| LEVEL 4: HIGHLY SENSITIVE CLINICAL DATA (PHI)                                                     |
| Examples: Clinical notes, ICD diagnoses, approved prescriptions, vitals, dose adherence logs       |
| Controls: Doctor-patient privilege; strict RBAC; isolated from pharmacy/reception; break-glass log.|
+---------------------------------------------------------------------------------------------------+
| LEVEL 5: FINANCIAL & CRYPTOGRAPHIC SECRETS                                                        |
| Examples: Razorpay API secrets, webhook signing keys, JWT secrets, bcrypt password hashes         |
| Controls: Excluded from source control; scrubbed from audit logs; constant-time comparison.       |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. Authentication Security

1. **Password Hardening:**
   - Enforced minimum length of 8 characters during registration and password reset (`backend/routes/auth.js:180`).
   - Strong hashing with `bcryptjs` using 10 salt rounds.
2. **Account Enumeration Defense:**
   - Both nonexistent accounts and incorrect passwords return identical, generic error payloads:
     ```json
     { "message": "Invalid email or password" }
     ```
   - Eliminates timing-based or message-based username harvesting.
3. **Mass Assignment Protection:**
   - Self-registration is restricted strictly to the `patient` role. Any registration request specifying `role: "admin"`, `doctor`, or `pharmacy` without administrative credentials is automatically rejected with `HTTP 403 Forbidden` (`backend/routes/auth.js:186`).
   - Profile update endpoint (`PUT /api/auth/profile`) whitelists permitted fields (`name`, `phone`, `address`, `emergencyContact`), stripping any malicious attempts to modify `role`, `email`, or `isVerified` (`backend/routes/auth.js:372`).
4. **Brute Force Defense:**
   - Applied sliding-window rate limiters (`backend/middleware/rateLimiter.js`) restricting authentication endpoints to 10 requests per minute per IP address.

---

## 6. Authorization / Role-Based Access Control (RBAC)

The TriMedi access control matrix enforces strict operational boundaries across five authenticated roles:

| API Domain / Resource | Patient | Doctor | Reception | Pharmacy | Admin |
|---|---|---|---|---|---|
| **View Own Medical Profile** | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| **Manage Clinic Queue** | DENY | ALLOW | ALLOW | DENY | ALLOW |
| **Conduct Consultation & Notes**| DENY | ALLOW | DENY (403)| DENY (403)| DENY |
| **Approve / Sign Prescription** | DENY | ALLOW | DENY (403)| DENY (403)| DENY |
| **Dispense Pharmacy Order** | DENY | DENY | DENY (403)| ALLOW | ALLOW |
| **Update Medicine Catalog Stock**| DENY | DENY | DENY (403)| ALLOW | ALLOW |
| **Verify Doctor Credentials** | DENY | DENY | DENY (403)| DENY (403)| ALLOW |
| **Query Security Audit Events** | DENY | DENY | DENY (403)| DENY (403)| ALLOW |
| **Trigger Emergency Break-Glass**| DENY | ALLOW | DENY (403)| DENY (403)| DENY |

---

## 7. Insecure Direct Object Reference (IDOR) Protection

Object-level access checks are programmatically enforced at the database query layer:
- **Medical Records & Consultations:** Validated that `consultation.patientId === req.user._id` (or `req.user.role === 'doctor'`). Verified by Test 8: Patient B querying Patient A records receives `HTTP 403 Forbidden`.
- **Digital Prescriptions:** Prescriptions are strictly isolated. Verified by Test 7: Patient B querying Patient A prescription receives `HTTP 403 Forbidden`.
- **Commerce Orders:** Orders can only be queried by the purchasing patient, the assigned pharmacy, or an administrator. Verified by Test 23 (Phase 4).
- **Socket.IO Event Isolation:** Socket rooms (`order_<id>`, `consultation_<id>`) verify JWT identity prior to allowing clients to join, blocking cross-user event eavesdropping.

---

## 8. Session Security & Revocation Lifecycle

1. **Token Revocation Blocklist:**
   - Implemented an in-memory token revocation set (`revokedTokens`) in `backend/middleware/authMiddleware.js`.
   - Explicit calls to `POST /api/auth/logout` immediately add the token to the revocation list, causing any subsequent request using that token to be rejected with `HTTP 401 Unauthorized` (Verified by Test 5).
2. **Global Session Invalidation:**
   - Password reset (`POST /api/auth/reset-password`) and password change (`POST /api/auth/change-password`) invoke `invalidateUserSessions(userKey)`.
   - Any previously issued JWT whose issuance timestamp (`iat`) precedes the invalidation event is automatically rejected across all devices.
3. **Single-Use Password Reset Tokens:**
   - Generated using 32 cryptographically secure random bytes (`crypto.randomBytes(32).toString("hex")`).
   - Stored in memory with an expiration timestamp ($15\text{ minutes}$) and marked single-use. Replay attempts are rejected with `HTTP 400 Bad Request` (Verified by Test 6).

---

## 9. Consent Architecture & Selective Revocation

A dedicated consent governance model was implemented in `backend/models/Consent.js` and exposed via `/api/consent`:

1. **Versioned Consent Capture:**
   - Each consent record tracks `patientId`, `consentType`, `policyVersion` (`"2026.1"`), `granted` boolean, `timestamp`, `ipAddress`, and `userAgent`.
2. **Selective Revocation:**
   - Patients can selectively grant or revoke optional data processing activities:
     - `AI_ASSISTED_CARE`: Permits de-identified clinical extraction.
     - `NOTIFICATION_SMS`: Permits automated SMS dosage and appointment reminders.
     - `MARKETING_RESEARCH`: Permits aggregated, non-clinical communication.
3. **Mandatory Clinical Care Protection:**
   - Mandatory operational consents (`CARE_DATA_SHARING`, `PRESCRIPTION_PROCESSING`) cannot be revoked while an active treatment relationship exists. Revocation attempts are rejected with `HTTP 400` and error code `MANDATORY_CONSENT_CANNOT_BE_REVOKED` (Verified by Test 25).

---

## 10. Clinical Privacy & Data Minimization

1. **Reception Staff Isolation:**
   - Reception staff require operational access to manage clinic check-in and queue tokens, but have no clinical need to access diagnoses or examination notes.
   - Database queries executed by the reception role project `-doctorNotes -diagnosis -treatmentPlan`, shielding sensitive clinical details (Verified by Test 10).
2. **Retail Pharmacy Isolation:**
   - Retail pharmacies require verified medication names, dosages, and quantities to fulfill orders.
   - Consultation notes, psychological assessments, and longitudinal medical histories are strictly omitted from pharmacy order queries (Verified by Test 11).
3. **Admin User Directory Minimization:**
   - Administrative dashboards displaying system metrics redact patient and staff email addresses to prevent internal reconnaissance (Verified by Test 12).
4. **Break-Glass Emergency Protocol:**
   - In acute medical emergencies where a doctor treats an unregistered or unresponsive patient, `POST /api/consultations/break-glass` permits emergency clinical record access.
   - The protocol enforces:
     - Non-clinical roles are strictly forbidden (`HTTP 403`).
     - Clinical justification string must be provided ($\ge 10$ characters).
     - Issues a 1-hour time-limited emergency session.
     - Logs a `CRITICAL` severity security event for immediate administrative audit.

---

## 11. File Upload Security & Prescription Privacy

Implemented a hardened file upload gateway in `backend/routes/uploads.js`:

1. **Magic Byte / Content Signature Verification:**
   - Validates file content using raw buffer inspection (`validateMagicBytes`), neutralizing MIME-spoofing attacks (e.g. an executable renamed to `.png`).
   - Valid signatures:
     - JPEG: `FF D8 FF`
     - PNG: `89 50 4E 47`
     - PDF: `25 50 44 46`
2. **Extension Whitelisting:**
   - Only `.jpg`, `.jpeg`, `.png`, and `.pdf` files are accepted. Dangerous extensions (`.exe`, `.sh`, `.js`, `.php`, `.bat`) are immediately rejected with `HTTP 400` (Verified by Test 16 & 17).
3. **Non-Predictable Storage:**
   - Uploaded files are renamed to cryptographically random UUIDs (`${crypto.randomUUID()}.${ext}`) and stored outside the public document root in `backend/uploads/prescriptions/`.
4. **Authorized Streaming Gateway:**
   - Files are never served as static assets. Access requires authenticated streaming via `GET /api/uploads/prescription/:fileId`.
   - Access is restricted strictly to the document owner (patient), treating physician, or dispensing pharmacy. Unauthorized callers receive `HTTP 403 Forbidden` (Verified by Test 19).

---

## 12. AI Security, Prompt Injection & Data Minimization

In compliance with the Phase 5 mandate, assistive AI pipelines (`backend/services/aiService.js`) were fortified with pre-inference sanitization and post-inference schema validation:

1. **Pre-Inference PII Redaction (`sanitizeClinicalInputForAI`):**
   - Strips patient phone numbers, email addresses, and street addresses using internationalized regular expressions before passing prompts to external LLMs.
   - Verified by Test 20: `Aditya Nikam, Phone: +91 98765 43210` becomes `Aditya Nikam, Phone: [REDACTED_PHONE]`.
2. **Adversarial Prompt Injection Detection (`detectPromptInjection`):**
   - Scans incoming clinical text for jailbreak patterns, including `"ignore previous instructions"`, `"system prompt override"`, `"bypass clinical safety"`, and `"pretend you are an unrestricted doctor"`.
   - Flags suspicious prompts and logs high-severity `AI_PROMPT_INJECTION_DETECTED` events (Verified by Test 21).
3. **Post-Inference Schema & Bounds Validator (`validateAIOutput`):**
   - Verifies that extracted medicines conform to safe clinical bounds:
     - Neutralizes embedded HTML/script tags (`<script>alert(1)</script>`) from medication names.
     - Detects and rejects impossible quantities ($\le 0$ or $> 365$ units).
     - Mandates structured dosage fields (Verified by Test 22).
4. **Mandatory Human-in-the-Loop:**
   - In accordance with [MEDICAL_AI_DISCLAIMER.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/MEDICAL_AI_DISCLAIMER.md), all AI extractions enter the system exclusively in `DRAFT` status. No prescription can be dispensed until a licensed physician reviews and cryptographically approves the record.

---

## 13. Cryptography & Encryption Architecture

| Data State | Mechanism | Configuration | Status |
|---|---|---|---|
| **Data in Transit** | TLS 1.3 / HTTPS | Enforced via HSTS header (`max-age=31536000; includeSubDomains`) | Standard |
| **Passwords at Rest** | `bcryptjs` | 10 salt rounds with adaptive cost | Production Ready |
| **Payment Signatures** | HMAC-SHA256 | Verified using `crypto.timingSafeEqual` | Production Ready |
| **Auth Tokens** | JWT | HMAC-SHA256 with 32+ character secret | Production Ready |
| **Reset / Upload IDs** | Cryptographic PRNG | `crypto.randomBytes(32)` / `crypto.randomUUID()` | Production Ready |
| **Database at Rest** | MongoDB WiredTiger Encryption | Dependent on cloud database configuration | External Dependency |

---

## 14. Secrets Management & Repository Audit

A comprehensive repository audit identified all sensitive tokens and environment variables:

1. **Audited Environment Variables (`backend/.env`):**
   - `JWT_SECRET`: Validated by `configValidator.js` to ensure minimum 32-character entropy in production.
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Configured with test credentials for sandbox validation.
   - `RAZORPAY_WEBHOOK_SECRET`: Required for cryptographic webhook verification.
   - `PORT`: Set to 5001.
2. **Critical Repository Finding — Action Required:**
   - During the static scan, `backend/.env` was observed to contain an active MongoDB Atlas connection URI:
     ```
     MONGO_URI=mongodb+srv://[REDACTED_DB_USER]:[REDACTED_DB_PASSWORD]@cluster0.lxxpoyn.mongodb.net/trimedi...
     ```
   - > [!CAUTION]
     > **ROTATE REQUIRED:** Live database credentials were found in the local configuration file and past commit history. Per production DevSecOps policy, this database credential is now marked as **COMPROMISED**. It must be rotated in the MongoDB Atlas console, purged from Git history, and injected strictly via a secure environment manager (e.g. AWS Secrets Manager, Doppler, or HashiCorp Vault).

---

## 15. API Security & Input Validation

- **Content-Type Enforcement:** All mutating endpoints require `application/json` or `multipart/form-data`.
- **Payload Size Limits:** Express body parsers are capped at $10\text{ MB}$ to prevent Denial-of-Service via payload exhaustion.
- **Unified Error Handling:** Handled via `backend/middleware/errorHandler.js`. Internal stack traces and database schema exceptions are stripped from production responses.

---

## 16. CORS & HTTP Security Headers

Configured in `backend/index.js` using `helmet`:

1. **Content Security Policy (CSP):**
   - Restricted `script-src` and `connect-src` to self and authorized payment gateways (Razorpay, PayPal).
2. **HTTP Strict Transport Security (HSTS):**
   - `max-age=31536000; includeSubDomains; preload` ensures browsers communicate exclusively over HTTPS.
3. **X-Content-Type-Options:**
   - Set to `nosniff`, preventing browsers from MIME-sniffing away from declared content types.
4. **X-Frame-Options:**
   - Set to `DENY`, preventing clickjacking attacks against clinical or payment interfaces.
5. **CORS Restrictions:**
   - Restricted to authorized origin `http://localhost:5173` (development) and production frontends, permitting only `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS` methods and requiring credentials.

---

## 17. Audit Logging Architecture

1. **Centralized Security Event Ledger (`backend/models/SecurityEvent.js`):**
   - Structured schema recording `eventType`, `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `userId`, `userRole`, `ipAddress`, `correlationId`, `details`, and `timestamp`.
2. **Correlation ID Tracking:**
   - Each incoming request is stamped with a unique `x-correlation-id` header to enable distributed request tracing across micro-services and audit logs.
3. **Automated Secret Scrubbing:**
   - The logging utility automatically strips passwords, tokens, API keys, and sensitive financial secrets from log payloads before persisting to disk or database (Verified by Test 19, Phase 4.5).

---

## 18. Security Monitoring & Threat Detection

1. **Automated Event Triggers:**
   - The system automatically emits and records structured `SecurityEvent` entries upon:
     - `FAILED_LOGIN_ATTEMPT` / `ACCOUNT_LOCKED`
     - `ROLE_TAMPERING_DETECTED` (Mass assignment attempt)
     - `UNAUTHORIZED_CLINICAL_ACCESS` (IDOR / Least-privilege violation)
     - `MALICIOUS_UPLOAD_BLOCKED` (Executable or spoofed upload)
     - `AI_PROMPT_INJECTION_DETECTED` (Adversarial input)
     - `BREAK_GLASS_INVOKED` (Emergency access)
2. **Administrative Threat Feed:**
   - Admin dashboard (`frontend/src/pages/dashboards/AdminDashboard.jsx`) includes a real-time security monitor displaying recent security events categorized by severity.

---

## 19. Data Export Architecture

Exposed via `GET /api/privacy/export`:
- Generates an authenticated, standardized JSON health record bundle containing:
  - Patient demographics (excluding internal hashed secrets)
  - Medical consultation histories
  - Digital prescriptions and dosages
  - Adherence logs and refill records
  - Active consent status
- **IDOR Enforced:** Patients can only export their own data; cross-patient export requests are rejected with `HTTP 403 Forbidden` (Verified by Test 9 & 26).

---

## 20. Data Retention & Account Deletion Lifecycle

Exposed via `/api/privacy/retention-policy` and `/api/privacy/delete-account`:
1. **Medical Retention vs "Right to Erasure":**
   - Statutory healthcare regulations mandate that clinical consultation records, prescriptions, and financial audit ledgers be retained for a minimum of 7 to 10 years.
2. **Soft Deletion & Clinical Archival:**
   - When a patient requests account deletion, the system revokes active authentication tokens, halts marketing and SMS notifications, but transitions clinical records to `RETAINED_FOR_LEGAL_COMPLIANCE` status (Verified by Test 27).

---

## 21. Incident Response Framework

Codified in [SECURITY_INCIDENT_RESPONSE.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/SECURITY_INCIDENT_RESPONSE.md). The plan establishes a 7-stage response lifecycle:
1. **Detection & Triage:** Automated alert classification via `SecurityEvent`.
2. **Containment:** Session invalidation (`invalidateUserSessions`) and IP rate limiting.
3. **Eradication:** Credential rotation and patch deployment.
4. **Recovery:** State restoration and audit log validation.
5. **Post-Incident Review:** Root cause analysis (RCA) within 72 hours.
6. **Regulatory Notification:** Statutory breach reporting within 72 hours of verification.
7. **Patient Transparency:** Notifying affected individuals in plain language.

---

## 22. Security & Privacy Test Suite Results

The Phase 5 test suite (`backend/test_phase5_security_privacy.js`) executed 29 automated security validations against the running TriMedi server:

| Test ID | Category | Description | Status |
|---|---|---|---|
| **Test 1** | Auth Security | Weak password (< 8 chars) rejected with HTTP 400 | **PASS** |
| **Test 2** | Auth Security | Public self-registration claiming 'admin' role rejected (HTTP 403) | **PASS** |
| **Test 3** | Auth Security | Generic error message prevents account enumeration during failed login | **PASS** |
| **Test 4** | RBAC / Tampering | Profile update strictly rejects unauthorized role tampering (HTTP 403) | **PASS** |
| **Test 5** | Session Security | Explicit logout marks token as revoked and blocks subsequent access (HTTP 401) | **PASS** |
| **Test 6** | Session Security | Password reset token is single-use only (Replay rejected with HTTP 400) | **PASS** |
| **Test 7** | IDOR Defense | Patient B forbidden from reading Patient A's prescription (HTTP 403) | **PASS** |
| **Test 8** | IDOR Defense | Patient B forbidden from querying Patient A's medical records (HTTP 403) | **PASS** |
| **Test 9** | IDOR Defense | Patient B forbidden from exporting Patient A's health records (HTTP 403) | **PASS** |
| **Test 10** | Least Privilege | Reception staff blocked from private clinical notes (HTTP 403) | **PASS** |
| **Test 11** | Least Privilege | Retail pharmacy blocked from private clinical histories (HTTP 403) | **PASS** |
| **Test 12** | Minimization | Unauthenticated caller receives redacted user emails from admin stats | **PASS** |
| **Test 13** | Break-Glass | Non-clinical roles strictly forbidden from break-glass access (HTTP 403) | **PASS** |
| **Test 14** | Break-Glass | Break-glass invocation requires clinical justification $\ge 10$ chars (HTTP 400)| **PASS** |
| **Test 15** | Break-Glass | Legitimate emergency justification grants 1-hour time-limited session | **PASS** |
| **Test 16** | File Security | Executable extensions (.exe, .sh) strictly rejected with HTTP 400 | **PASS** |
| **Test 17** | File Security | Magic byte signature mismatch rejected (MIME spoofing defense) | **PASS** |
| **Test 18** | File Security | Authentic prescription stored with non-predictable UUID | **PASS** |
| **Test 19** | File Security | Patient B blocked from streaming Patient A's prescription (HTTP 403) | **PASS** |
| **Test 20** | AI Minimization | `sanitizeClinicalInputForAI` strips patient email and phone number | **PASS** |
| **Test 21** | AI Security | Adversarial prompt injection patterns detected and flagged | **PASS** |
| **Test 22** | AI Output Safety | AI Output Schema Validator detects scripts and out-of-bounds quantities | **PASS** |
| **Test 23** | Consent | Versioned consent granted and audited with policy metadata (2026.1) | **PASS** |
| **Test 24** | Consent | Optional consent (`NOTIFICATION_SMS`) can be selectively revoked | **PASS** |
| **Test 25** | Consent | Mandatory clinical care consent revocation blocked (HTTP 400) | **PASS** |
| **Test 26** | Data Export | Sovereign data export generates complete health bundle without secrets | **PASS** |
| **Test 27** | Data Retention | Deletion request marks records `RETAINED_FOR_LEGAL_COMPLIANCE` | **PASS** |
| **Test 28** | HTTP Headers | Security headers (nosniff, frame, csp, hsts) verified on responses | **PASS** |
| **Test 29** | Monitoring | Threat monitoring feed accessible to Admin with role-based governance | **PASS** |

**Summary: 29 Passed, 0 Failed (100% Pass Rate)**

---

## 23. Complete Regression Testing Summary

To guarantee zero regressions across the codebase, all previous test suites were executed sequentially:

| Test Suite | Milestone / Scope | Tests Run | Passed | Failed | Result |
|---|---|---|---|---|---|
| `test_phase2_workflow.js` | Clinical Operations & Queue Lifecycle | 21 | 21 | 0 | **PASS** |
| `test_phase3_medication_ai.js` | AI Extraction & Medication Adherence | 41 | 41 | 0 | **PASS** |
| `test_phase4_commerce_fulfillment.js` | Pharmacy Commerce & Payment Verification | 29 | 29 | 0 | **PASS** |
| `test_phase4_5_production_hardening.js`| Database Guard, Concurrency & GST Invoicing | 19 | 19 | 0 | **PASS** |
| `test_audit.js` | Socket.IO Auth & Deduplication Audit | 7 | 7 | 0 | **PASS** |
| `test_phase5_security_privacy.js` | Security, Privacy, Consent & Trust | 29 | 29 | 0 | **PASS** |
| **Total Automated Coverage** | **All TriMedi Platform Phases** | **146** | **146** | **0** | **100% PASS** |

**Frontend Production Build:** Built with Vite in $1.11\text{s}$ with **0 errors**.

---

## 24. Remaining Risks & Technical Debt

1. **MongoDB Connection String Exposure:** As noted in Section 14, `backend/.env` contains Atlas database credentials requiring rotation prior to public deployment.
2. **In-Memory Blocklist Scalability:** The current token revocation set (`revokedTokens`) is stored in process memory. In a multi-instance, clustered production deployment (Phase 6), this must be backed by a distributed Redis instance.
3. **Antivirus / ClamAV File Scanning:** File uploads currently validate extensions and magic bytes. Adding binary scanning via ClamAV is recommended for enterprise deployment.
4. **Rate Limiting Persistence:** The sliding-window rate limiter is currently in-memory, resetting on process restart.

---

## 25. External Dependencies

| Dependency | Purpose | Requirement |
|---|---|---|
| **MongoDB Atlas** | Distributed Database | Requires TLS 1.3 enforcement and IP access list lockdown |
| **Razorpay Production Account**| Payment Gateway | Requires merchant KYC verification and production key activation |
| **External LLM Provider** | Prescription OCR Parsing | Requires Business Associate Agreement (BAA) / Data Processing Addendum (DPA) |
| **Twilio / Gupshup** | SMS Gateway | Required for real-world SMS dosage notifications |
| **SendGrid / AWS SES** | Email Gateway | Required for password reset delivery in non-mock environments |

---

## 26. Legal Review Requirements

The following foundational legal documents have been authored as technical drafts and require formal legal sign-off:
1. **[PRIVACY_POLICY.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/PRIVACY_POLICY.md):** Defines data collection categories, purpose limitation, patient rights, and retention schedules. (*Marked: LEGAL REVIEW REQUIRED*).
2. **[TERMS_OF_SERVICE.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/TERMS_OF_SERVICE.md):** Defines user obligations, acceptable use, liability limitations, and emergency medical disclaimers. (*Marked: LEGAL REVIEW REQUIRED*).
3. **[MEDICAL_AI_DISCLAIMER.md](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/MEDICAL_AI_DISCLAIMER.md):** Mandates assistive AI positioning, requiring licensed doctor review before clinical reliance. (*Marked: LEGAL REVIEW REQUIRED*).

---

## 27. Production Readiness Matrix

| Dimension | Rating | Technical Justification |
|---|---|---|
| **Database Security** | **YELLOW** | Hardened fail-safe guard active; MongoDB URI in `.env` must be rotated. |
| **Authentication** | **GREEN** | Brute-force rate limiting, password length validation, no enumeration. |
| **Authorization / RBAC** | **GREEN** | 5 roles strictly enforced; non-admin verification blocked; profile mass assignment blocked. |
| **IDOR Defense** | **GREEN** | Verified object ownership checks on consultations, prescriptions, and orders. |
| **Session Security** | **GREEN** | In-memory token revocation, multi-device password reset invalidation. |
| **MFA / Step-up** | **YELLOW** | Single-use reset tokens implemented; TOTP/SMS 2FA scheduled for Phase 6. |
| **Clinical Privacy** | **GREEN** | Reception and pharmacy restricted from sensitive examination notes. |
| **Prescription Privacy** | **GREEN** | UUID storage, magic byte verification, authenticated streaming gateway. |
| **File Upload Security** | **GREEN** | Executables blocked, magic byte verification, streaming access control. |
| **AI Security** | **GREEN** | PII stripping, prompt injection detection, output bounds schema validation. |
| **Consent Management** | **GREEN** | Versioned consent model, selective revocation, mandatory care protections. |
| **Data Minimization** | **GREEN** | Redacted admin metrics, stripped clinical projections. |
| **Encryption** | **GREEN** | HSTS, TLS 1.3 headers, constant-time HMAC comparison. |
| **Secrets Management** | **YELLOW** | Validator active; `.env` database secret rotation required. |
| **CORS & Headers** | **GREEN** | Helmet configured: CSP, HSTS, X-Frame-Options, X-Content-Type-Options. |
| **Audit Logging** | **GREEN** | Structured `SecurityEvent` schema, correlation ID, secret scrubbing. |
| **Monitoring** | **GREEN** | Admin threat monitor feed with real-time severity classification. |
| **Incident Response** | **GREEN** | 7-stage lifecycle with 9 actionable runbooks in `SECURITY_INCIDENT_RESPONSE.md`. |
| **Data Export** | **GREEN** | Sovereign JSON health export with IDOR protection. |
| **Data Retention** | **GREEN** | Legal retention overrides erasure for clinical audit trail integrity. |
| **Legal Documentation** | **YELLOW** | Technical drafts complete; formal legal sign-off required. |
| **Payment Security** | **GREEN** | Server-authoritative calculations, HMAC verification, refund bounds checking. |
| **Existing Commerce** | **GREEN** | 29/29 Phase 4 commerce tests passing without regressions. |
| **Existing Clinical** | **GREEN** | 21/21 Phase 2 clinical tests passing without regressions. |

---

## 28. Phase 6 Entry Conditions

The TriMedi platform has attained technical stability and security hardening suitable for controlled clinical pilots. Migration to Phase 6 (Enterprise Scale & Nationwide Network) requires fulfilling the following entry criteria:
1. **Rotate MongoDB Credentials:** Rotate database passwords in MongoDB Atlas and inject via environment secrets manager.
2. **Execute Formal Legal Review:** Complete statutory legal review of `PRIVACY_POLICY.md`, `TERMS_OF_SERVICE.md`, and `MEDICAL_AI_DISCLAIMER.md`.
3. **Execute External Vendor BAAs:** Execute Data Processing Addendums with AI and cloud infrastructure providers.
4. **Deploy Distributed Cache (Redis):** Transition the in-memory token revocation blocklist and rate limiter to a shared Redis cluster before scaling beyond a single server instance.
5. **Activate Production Payment Gateway:** Replace Razorpay sandbox keys with verified production merchant keys.
