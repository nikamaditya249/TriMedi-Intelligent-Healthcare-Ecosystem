# TriMedi Intelligent Healthcare Ecosystem — Security Incident Response Plan (SIRP)

**Document Version:** 1.0.0 (Phase 5 Security Operations)  
**Authority:** Security Incident Response Team (SIRT) & Data Protection Officer (DPO)  
**Date:** October 17, 2026  
**Compliance Note:** Regulatory notification timelines and procedures require external legal and compliance validation prior to deployment.

---

## 1. Incident Lifecycle

The TriMedi Incident Response Plan follows a 7-stage operational lifecycle:

```
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌───────────┐
│ 1. DETECT │ ──> │ 2. CONTAIN│ ──> │3.INVESTIGATE│ ──> │4.ERADICATE│
└──────────┘     └───────────┘     └─────────────┘     └───────────┘
                                                             │
┌─────────────────────────┬───────────────────┬──────────────┘
│                         │                   │
▼                         ▼                   ▼
┌───────────┐     ┌───────────┐     ┌──────────────────────┐
│ 5. RECOVER│ ──> │ 6. NOTIFY │ ──> │ 7. POST-INCIDENT REV │
└──────────┘     └───────────┘     └──────────────────────┘
```

1. **DETECT:** Automated alerts from `logSecurityEvent`, anomaly thresholds (failed login spikes, IDOR attempts, payment signature mismatches), or external reports.
2. **CONTAIN:** Immediate isolation of compromised sessions, revocation of active JWT tokens, blocking malicious IP addresses, or placing specific services in maintenance mode.
3. **INVESTIGATE:** Forensic inspection of append-only `ClinicalAudit` and security event logs, correlation ID tracing, and assessing blast radius.
4. **ERADICATE:** Revocation and rotation of compromised credentials, patching exploited vulnerabilities, invalidating all sessions for affected accounts.
5. **RECOVER:** Safe service restoration, database restore from point-in-time snapshots if required, verification of system invariants (stock counts, ledger balances).
6. **NOTIFY:** Internal escalation to clinical governance and legal team; notification to affected data subjects and regulatory authorities pursuant to verified legal requirements.
7. **POST-INCIDENT REVIEW:** Comprehensive root cause analysis (RCA), corrective and preventive action (CAPA) tracking, and threat model updates within 14 days of incident resolution.

---

## 2. Severity Classification Matrix

| Severity Level | Definition | Response SLA | Examples |
|---|---|---|---|
| **SEV-1 (CRITICAL)** | Active clinical data breach, system-wide compromise, unauthenticated RCE, database exfiltration. | Immediate (15 mins) | Database dump leaked, master JWT secret compromised, ransomware detected. |
| **SEV-2 (HIGH)** | Individual patient account takeover, payment gateway compromise, unauthorized clinical record tampering. | Within 1 hour | Stolen physician credentials, malicious prescription issued, forged payment verified. |
| **SEV-3 (MEDIUM)** | Isolated IDOR attempt blocked, abnormal rate limit triggers, suspicious upload rejected. | Within 4 hours | Attacker probing `/api/prescriptions/:id` with randomized IDs, repeated failed logins. |
| **SEV-4 (LOW)** | Minor security alert, informational event, non-exploitable anomaly. | Within 24 hours | Single expired token submitted, malformed client payload. |

---

## 3. Incident Specific Runbooks

### Runbook 1: Credential / Secret Leak
1. **Trigger:** Secrets discovered in logs, public repositories, or client bundles (e.g. `JWT_SECRET`, `MONGO_URI`, `RAZORPAY_KEY_SECRET`).
2. **Containment:** Immediately label secret as `ROTATE REQUIRED`.
3. **Eradication:**
   - Invalidate the secret in the cloud provider/payment gateway dashboard.
   - Generate a new cryptographically secure secret (minimum 64 bytes).
   - Deploy new secret into environment variables vault.
   - Invalidate all existing patient and staff sessions by incrementing the system token version or clearing active sessions.
4. **Recovery & Review:** Audit logs for unauthorized transactions during the exposure window.

### Runbook 2: Database Breach / Unauthorized Exfiltration
1. **Trigger:** High-volume medical record queries detected, unexpected IP querying database directly.
2. **Containment:**
   - Immediately terminate database connections from unauthorized IPs.
   - Temporarily enable strict maintenance mode or restrict API ingress.
3. **Investigation:** Query `ClinicalAudit` for `resourceType: "patient"` and `action: "PATIENT_MEDICAL_RECORD_VIEWED"` to determine exact accounts accessed.
4. **Notification:** Escalate to Legal Counsel and DPO to draft statutory notifications under applicable healthcare and data protection laws.

### Runbook 3: Patient Data Exposure / IDOR Exploitation
1. **Trigger:** Security alert `IDOR_ATTEMPT` or user report of viewing another patient's data.
2. **Containment:** Revoke the offending user's session token; temporarily block the endpoint if vulnerability is unpatched.
3. **Eradication:** Deploy emergency fix enforcing email equality check against authenticated token.
4. **Audit:** Assess which records were queried by the offending account ID.

### Runbook 4: Stolen Account / Account Takeover
1. **Trigger:** Patient reports unexpected orders or profile changes; logins from anomalous geolocations.
2. **Containment:** Invalidate all active sessions for the user (`tokenRevocationList` or `passwordChangedAt` timestamp). Lock account temporarily.
3. **Eradication:** Send secure password reset link to verified phone/email. Revert unauthorized profile or order modifications.
4. **Recovery:** Patient confirms identity via secondary verification; account restored.

### Runbook 5: Payment Gateway Compromise / Fraud
1. **Trigger:** Webhook signature mismatches, repeated refund rejections, anomalous order amounts.
2. **Containment:** Pause automatic fulfillment for affected orders; switch payment routes to manual verification.
3. **Investigation:** Cross-reference Razorpay dashboard logs against TriMedi `reconciliationService` reports.
4. **Eradication:** Rotate `RAZORPAY_WEBHOOK_SECRET` and `RAZORPAY_KEY_SECRET`.

### Runbook 6: Ransomware / Host Compromise
1. **Trigger:** Encrypted files, unexpected background processes, server unresponsive.
2. **Containment:** Disconnect the compromised server instance from the network immediately. Prevent lateral spread.
3. **Eradication:** Provision a fresh server image from trusted container registry.
4. **Recovery:** Restore MongoDB from the latest uncorrupted point-in-time Atlas backup snapshot. Verify data integrity.

### Runbook 7: Malicious Upload / Malware Attachment
1. **Trigger:** Malware scanning alert, executable file disguised as prescription image.
2. **Containment:** Quarantine uploaded file immediately; block the uploader account.
3. **Investigation:** Confirm whether the file was processed by the AI worker or viewed by a clinician.
4. **Eradication:** Purge file from storage; update MIME magic byte validation filters.

### Runbook 8: External AI Data Leakage
1. **Trigger:** Report that sensitive clinical identifiers were transmitted in unredacted format to external LLM provider.
2. **Containment:** Temporarily switch `AIService` to local deterministic clinical heuristic engine (`_parseWithLocalNLP`).
3. **Eradication:** Enforce pre-flight data minimization sanitization filter (`sanitizeClinicalInputForAI`) that scrubs patient name, email, phone, and address before external dispatch.

### Runbook 9: Unauthorized Clinical Access / Insider Threat
1. **Trigger:** Staff member querying patient records without assigned consultation encounter.
2. **Containment:** Suspend the staff member's active credentials pending clinical governance review.
3. **Investigation:** Review complete audit history of the actor via `queryAuditLogs`.
4. **Notification:** Present findings to the Medical Ethics Board and Clinical Compliance Officer.

---

## 4. Regulatory & External Dependencies

> [!IMPORTANT]
> **Legal Review Required:** Specific statutory breach notification windows (e.g. 72 hours under certain frameworks or CERT-In directives in India) depend on legal entity registration, jurisdictional applicability, and contractual terms. All external breach notifications must be reviewed and authorized by designated legal counsel.
