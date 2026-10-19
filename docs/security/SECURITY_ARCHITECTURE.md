# TriMedi Intelligent Healthcare Ecosystem
## Security Architecture & Defense-in-Depth Specification

**Document Reference:** `docs/security/SECURITY_ARCHITECTURE.md`  
**Classification:** Core Security Architecture & Governance  
**Status:** Technically Verified / Production Hardened  

---

### 1. Security Architecture Principles

TriMedi adheres to healthcare security and privacy-by-design standards:
1. **Defense-in-Depth:** Multiple redundant verification layers at network, transport, application, and database tiers.
2. **Zero Trust & Least Privilege:** Role-based access control (RBAC) ensures actors only access data strictly necessary for their function.
3. **Clinical Confidentiality:** Clinical diagnosis notes and medical records are shielded from commercial and operational roles (reception, pharmacy).
4. **Non-Delegation:** AI cannot execute clinical actions or approve prescriptions autonomously.
5. **Tamper-Evident Auditability:** Critical clinical and financial state transitions are cryptographically hashed and logged.

---

### 2. Authentication & Session Security

- **JWT Issuance & Cryptographic Signature:**
  - Tokens are signed using HMAC-SHA256 with a 64-character hexadecimal CSPRNG secret (`crypto.randomBytes(32)`).
  - Weak passwords and default keys (e.g. `secret123`, keys $< 32\text{ characters}$) are strictly rejected at startup by `configValidator.js`.
  - Fallback defaults in source code are eliminated in production via `getJwtSecret()`.
- **Session Blacklisting & Revocation:**
  - Token revocations are tracked in `SecurityStore`.
  - Stolen or compromised credentials can be revoked immediately, invalidating active sessions across all devices.
- **Password Protection:** Passwords are hashed with `bcryptjs` using a salt work factor of $\ge 10$.

---

### 3. Role-Based Access Control (RBAC) & Boundary Isolation

| User Role | Permitted Actions | Prohibited / Shielded Boundaries |
|---|---|---|
| **Patient** | View own consultations, book appointments, log doses, view active prescriptions, order medicines | Cannot view other patients' records (IDOR), cannot approve prescriptions, cannot access pharmacy inventory controls |
| **Doctor (RMP)** | Conduct clinical encounters, create/sign prescriptions, review contraindications | Cannot alter pharmacy orders or access other doctors' private drafts |
| **Receptionist** | Schedule appointments, check in patients, manage clinic queues | **STRICTLY BLOCKED** from clinical diagnoses, doctor consultation notes, and prescriptions |
| **Pharmacist** | Verify prescription authenticity, advance order fulfillment (`ACCEPTED` → `DELIVERED`), replenish stock | **STRICTLY BLOCKED** from private consultation notes, diagnoses, and medical histories |
| **Administrator** | System telemetry, audit inspection, physician verification | **CANNOT** silently alter or forge clinical encounter notes |

---

### 4. IDOR Defense & Tenant Data Isolation

TriMedi completely avoids trusting client-supplied user IDs or role claims:
- Identity is derived strictly from the verified JWT payload (`req.user.id`).
- Route interceptors verify document ownership:
  ```javascript
  if (consultation.patientId.toString() !== req.user.id && req.user.role !== 'doctor') {
    return res.status(403).json({ error: "Access denied: Cross-patient access forbidden." });
  }
  ```
- Cross-tenant queries are blocked and audited with high-severity alerts (`UNAUTHORIZED_CLINICAL_ACCESS`).

---

### 5. Input Validation, Abuse Prevention & Upload Security

- **Sliding-Window Rate Limiting:** Coordinated request throttling intercepts credential brute-forcing and API denial-of-service attempts.
- **Magic-Byte File Inspection:** File uploads for prescription images are verified via binary magic numbers (`\xFF\xD8\xFF` for JPEG, `\x89PNG` for PNG). Renamed executables or disguised scripts are rejected.
- **Payload Limits:** Request bodies are capped at 2MB to prevent memory exhaustion attacks.
- **Adversarial AI Defense:** Prescription OCR text is audited for prompt injection patterns (`ignore previous instructions`, `system override`) and neutralized.

---

### 6. Payment & Webhook Security

- **Server-Authoritative Pricing:** Client-provided prices are completely discarded. The server computes item totals, GST splits, and shipping based on authoritative database catalog records.
- **Cryptographic Signature Verification:** PayPal webhooks and capture callbacks require constant-time HMAC signature checks (`crypto.timingSafeEqual`) to prevent timing attacks.
- **Idempotency & Replay Neutralization:** Deduplication caches intercept replayed webhooks and duplicate capture requests, preventing duplicate stock commitments or fulfillment loops.

---

### 7. Audit Logging & Sensitive Data Scrubbing

- **Chained Audit Trail:** All clinical status changes and payments are stored in `clinicalaudits` and `aiaudits` collections with SHA-256 integrity hashes.
- **Secret Scrubbing:** The audit logger intercepts and strips sensitive tokens (`password`, `token`, `secret`, `authorization`, `credit_card`) prior to persistence.
