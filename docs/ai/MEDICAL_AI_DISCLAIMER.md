# TriMedi Intelligent Healthcare Ecosystem — Medical AI Transparency Notice & Clinical Disclaimer

**Document Status:** TECHNICAL / PRODUCT DRAFT ONLY  
**Legal Classification:** LEGAL & CLINICAL GOVERNANCE REVIEW REQUIRED  
**Date:** October 17, 2026  

---

> [!WARNING]
> **CRITICAL MEDICAL NOTICE & EMERGENCY WARNING:**  
> TriMedi is an intelligent healthcare management and clinical operations platform. TriMedi's artificial intelligence and optical character recognition (OCR) features are **strictly assistive tools** designed to facilitate administrative data entry and clinical organization.  
> 
> **TRIMEDI DOES NOT PROVIDE AUTONOMOUS MEDICAL DIAGNOSIS, AUTONOMOUS PRESCRIPTIONS, OR INDEPENDENT CLINICAL DECISION-MAKING.**  
> If you are experiencing a life-threatening medical emergency, call emergency services immediately or visit the nearest emergency medical facility. Do not rely on TriMedi or its AI tools for urgent medical situations.

---

## 1. Assistive Nature of AI Technology

1. **Human-in-the-Loop Clinical Authority:** All clinical prescriptions, dosage recommendations, treatment plans, and diagnostic assessments must be reviewed, verified, and formally authorized by a licensed, certified medical doctor prior to becoming active or clinically actionable.
2. **Draft Status of AI Extraction:** Any data extracted or parsed from prescription images, physical scans, or patient narratives by TriMedi AI is marked as **DRAFT / PENDING REVIEW**. It possesses zero clinical validity until an authorized medical doctor reviews each individual field, approves the data, and signs the record.
3. **Potential for Errors and Hallucinations:** Machine learning models, including large language models (LLMs) and OCR engines, may misinterpret handwriting, misread dosages, confuse similarly spelled drug names, or produce erroneous outputs. Both clinicians and patients must exercise diligence and never assume AI output is infallible.

---

## 2. Patient Responsibilities

1. **Verify Prescriptions:** Patients must independently verify that their printed or digital prescription accurately reflects the advice and directions provided by their treating physician.
2. **No Self-Medication:** Patients must not initiate, alter, or terminate any medication regimen solely based on AI-generated reminders, refill estimates, or adherence telemetry without direct consultation with their doctor.
3. **Disclose Allergies and Medications:** Patients are responsible for providing complete and accurate medical information, including known drug allergies and current medication usage.

---

## 3. Clinician Responsibilities

1. **Sole Prescribing Authority:** The licensed medical doctor retains exclusive legal and clinical responsibility for issuing, modifying, or cancelling digital prescriptions.
2. **Duty of Care:** The treating doctor must clinically inspect all AI-extracted candidate items, dosages, routes, and frequencies against the original prescription document before signing off. Under no circumstances may a doctor delegate clinical judgement to an automated tool.
3. **Drug Interaction Verification:** While TriMedi provides automated drug-drug interaction and allergy warning heuristics, the physician must independently evaluate the clinical appropriateness of all combined therapies.

---

## 4. Privacy & Data Minimization in AI Processing

1. **De-Identification:** Where external AI models (e.g. Google Gemini) are invoked for unstructured text parsing, personal identifiers such as phone numbers, home addresses, and financial account numbers are stripped before transmission.
2. **Prompt Isolation:** Untrusted document text is encapsulated within secure delimiters to prevent prompt injection and unauthorized command execution.
3. **Consent:** Patients are informed of AI-assisted processing upon onboarding and may review active consent records in their Privacy & Trust dashboard.
