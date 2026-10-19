# TriMedi Intelligent Healthcare Ecosystem
## Clinical AI Safety, Assistive Architecture & Governance

**Document Reference:** `docs/ai/AI_SAFETY.md`  
**Classification:** Clinical Governance & Assistive AI Safety  
**Status:** Implemented & Verified (100% Invariants Enforced)  

---

### 1. Clinical Non-Delegation Principle

TriMedi AI operates strictly as an **Assistive Clinical Decision Support (CDSS)** mechanism. Under the Telemedicine Practice Guidelines (2020) and CDSCO AI Guidelines, medical judgment is non-delegable to automated software systems.

```
┌────────────────────────────────────────────────────────┐
│             CORE CLINICAL SAFETY INVARIANTS            │
├────────────────────────────────────────────────────────┤
│ 1. AI MUST NEVER diagnose autonomously                 │
│ 2. AI MUST NEVER prescribe autonomously                │
│ 3. AI MUST NEVER approve prescriptions                 │
│ 4. AI MUST NEVER override doctor decisions             │
│ 5. AI MUST NEVER change clinical severity levels       │
│ 6. AI MUST NEVER bypass clinical review                │
│ 7. AI MUST NEVER make final clinical decisions         │
└────────────────────────────────────────────────────────┘
```

---

### 2. Assistive Prescription Extraction Pipeline

```
┌──────────────────────┐
│  Prescription Image  │
│  (Uploaded by Doctor)│
└──────────┬───────────┘
           │ Magic-byte validation (JPEG/PNG)
┌──────────▼───────────┐
│ Google Gemini OCR/NLP│
│ (Assistive Parser)   │
└──────────┬───────────┘
           │ Output Schema Validation & Sanitization
┌──────────▼───────────┐
│ Draft Prescription   │ ──> Status STRICTLY FORCED to "draft"
│ (aiaudits record)    │     Confidence score stamped (0.0 - 1.0)
└──────────┬───────────┘
           │ Mandatory Physician Review
┌──────────▼───────────┐
│ Registered Medical   │ ──> Doctor validates dosage & contraindications
│ Practitioner Review  │     Doctor edits or approves with digital signature
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ Active Prescription  │ ──> Only now can medicine be dispensed
└──────────────────────┘
```

---

### 3. Model & Provider Configuration

- **Primary Provider:** Google Gemini API (`models/gemini-1.5-flash` or `gemini-pro`).
- **Resilient Fallback:** If the external AI service is offline or unreachable, TriMedi falls back to local clinical heuristics and deterministic OCR parsing, or prompts the physician for direct manual input.
- **Data Minimization:** Patient PII (name, phone, address) is scrubbed before transmitting image buffers to the AI model.

---

### 4. Adversarial Defense & Schema Validation

- **Prompt Injection Neutralization:** All OCR text is scanned for jailbreak and system-prompt override attempts (`ignore previous instructions`, `system prompt`, `you are now a doctor`). Suspicious payloads are neutralized and flagged.
- **Uncertainty Principle:** If a dosage or frequency is ambiguous or illegible, the AI parser returns `confidence: 0.0` with `value: null`. Hallucinated or speculative clinical values are strictly prohibited.
- **Schema Boundaries:** Numerical quantities are bounded to safe therapeutic ranges. Negative or extreme dosages are rejected by Mongoose schema validators.

---

### 5. Auditability & Chained Accountability

Every assistive AI extraction creates an immutable record in the `aiaudits` collection containing:
1. `rawOutput`: Unmodified output from the LLM/OCR engine.
2. `confidence`: Calculated confidence score per extracted medication entity.
3. `modelProvider`: Model identifier and version used.
4. `humanReviewerId`: MongoDB ObjectID of the licensed physician who reviewed the output.
5. `finalDecision`: Complete record of physician approvals, edits, or rejections.
6. `auditEvent`: Cryptographically hashed event logged in `clinicalaudits`.
