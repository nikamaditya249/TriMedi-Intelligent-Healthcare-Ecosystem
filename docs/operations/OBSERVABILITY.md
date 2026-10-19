# TriMedi Intelligent Healthcare Ecosystem
## Observability, Telemetry & Operational Monitoring Specification

**Document Reference:** `docs/operations/OBSERVABILITY.md`  
**Classification:** Operational Governance & Site Reliability Engineering (SRE)  
**Status:** Implemented & Verified  

---

### 1. Observability Pillars & Architecture

TriMedi integrates a 3-pillar observability architecture designed for HIPAA, DPDP Act (2023), and ISO 27001 healthcare telemetry standards:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Inbound Request Pipeline                     │
│    - Inject / Propagate `x-correlation-id`                       │
│    - Capture API Duration, Method, Route, Status, Client IP     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                   Structured Telemetry Bus                      │
│    - JSON Structured Logger (`auditService.js`)                 │
│    - Automatic Secret & PHI Scrubbing Filters                   │
│    - Real-Time Security Event Dispatch (`SecurityEvent.js`)     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                   Probes & Incident Streaming                   │
│    - Liveness (`/live`), Readiness (`/ready`), Health (`/health`)│
│    - Admin Security Monitoring Stream (Socket.IO)               │
│    - Alert Escalations (PagerDuty, Slack, CloudWatch)           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Distributed Tracing & Correlation IDs

Every inbound HTTP request and WebSocket connection is stamped with a unique distributed correlation identifier:
- **Header:** `x-correlation-id`
- **Format:** `req_<timestamp>_<hex>` or UUID v4.
- **Propagation:** Attached to all asynchronous workflows:
  $$\text{Check-in} \longrightarrow \text{Doctor Consultation} \longrightarrow \text{Prescription Extraction} \longrightarrow \text{PayPal Capture}$$
- **Queryability:** Enables cross-component log querying to trace failures across doctor, patient, pharmacy, and payment systems.

---

### 3. Metric Streams & SRE Thresholds

| Telemetry Metric | Component / Event | Target SLA / SLO | Alert Threshold (P1/P0) |
|---|---|---|---|
| **API Latency (p95)** | Core REST Endpoints | $< 250\text{ms}$ | $> 1000\text{ms}$ for 3 consecutive minutes |
| **API Error Rate** | 5xx Server Errors | $< 0.1\%$ | $> 1.0\%$ over 5-minute rolling window |
| **Database Latency** | MongoDB Atlas Ping | $< 50\text{ms}$ | $> 300\text{ms}$ or 3 consecutive timeouts |
| **Payment Failures** | PayPal Capture / Init | $< 0.5\%$ | $> 2$ consecutive capture rejections |
| **Webhook Failures** | PayPal Webhook Delivery | $0\%$ drop | $> 0$ unhandled signature failures |
| **AI Failures** | Prescription OCR Pipeline | $< 2\%$ | $> 5$ consecutive Gemini API timeouts |
| **Queue Failures** | Clinic Queue State Machine | $0$ deadlocks | Token jump without check-in event |
| **Auth Failures** | Brute Force Attacks | N/A | $> 5$ failed login attempts from single IP |
| **Security Events** | IDOR / Privilege Escalation | $0$ tolerance | Immediate P0 alert dispatched |

---

### 4. Mandatory Log Sanitization & Scrubbing Rules

To maintain strict statutory patient privacy and credential security, the logging engine automatically scrubs the following tokens before persistence or transmission:

| Data Category | Field Names Scrubbed | Replacement Token |
|---|---|---|
| **User Credentials** | `password`, `newPassword`, `currentPassword`, `pin` | `[REDACTED_PASSWORD]` |
| **Session Secrets** | `token`, `jwt`, `secret`, `apiKey`, `authorization`, `signature` | `[REDACTED_SECRET]` |
| **Database Secrets** | `mongodb+srv://user:pass@...` | Sanitized URI string |
| **Payment Secrets** | `PAYPAL_CLIENT_SECRET`, `cvv`, `cardNumber`, `accountNumber` | `[REDACTED_FINANCIAL]` |
| **AI API Secrets** | `GEMINI_API_KEY` | `[REDACTED_API_KEY]` |
| **Unnecessary PHI** | Clinical consultation free-text narratives | Scrubbed from general server access logs |

---

### 5. Health Probes Implementation

1. **`GET /live` (Process Liveness):**
   - Returns HTTP 200 `{"status":"ALIVE","uptimeSeconds":...}`
   - Confirms the Node.js event loop is running and accepting socket connections.
2. **`GET /ready` (Traffic Readiness):**
   - Returns HTTP 200 `{"status":"READY","database":"connected",...}`
   - If MongoDB Atlas is disconnected or unreachable, immediately emits HTTP 503 `DATABASE_UNAVAILABLE` to remove the container from the load balancer.
3. **`GET /health` (Sanitized Telemetry):**
   - Returns detailed subsystem operational status (MongoDB latency, single-instance/Redis mode, memory usage) with all connection strings and credentials scrubbed.
