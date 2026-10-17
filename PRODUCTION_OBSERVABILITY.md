# TriMedi Platform — Production Observability, Telemetry & Alerting Guide

**Author:** Platform Reliability Engineering & DevSecOps  
**Date:** October 17, 2026  
**Ecosystem:** TriMedi — Intelligent Healthcare Ecosystem  
**Target:** Staging, Controlled Pilot, Production Monitoring  

---

## 1. Observability Architecture Overview

The TriMedi Observability Framework operates across three telemetry pillars: **Structured Distributed Logging**, **Real-Time Health & Performance Metrics**, and **Security Threat Event Streaming**.

```
+-----------------------------------------------------------------------------------+
|  1. INCOMING HTTP / WEBSOCKET REQUEST                                              |
|     - Generate / Propagate `x-correlation-id` Header                              |
|     - Capture Request Latency & HTTP Status Code                                  |
+-----------------------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------------------+
|  2. CENTRALIZED TELEMETRY BUS                                                     |
|     - Structured JSON Logger (`auditService.js`)                                  |
|     - Automatic Sensitive Secret Scrubbing (Passwords, Bearer Tokens, Keys)       |
|     - Threat Event Emission (`SecurityEvent.js`)                                  |
+-----------------------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------------------+
|  3. MONITORING & ESCALATION STACK                                                 |
|     - Health Probes: `/live`, `/ready`, `/health`                                 |
|     - Admin Real-Time Security Monitor (Socket.IO + AdminDashboard.jsx)           |
|     - Alerting Engine (Slack, PagerDuty, CloudWatch Alarms)                       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Distributed Tracing & Correlation IDs

Every inbound HTTP request and WebSocket handshake is assigned or preserves a unique distributed tracing identifier:
- **Header Name:** `x-correlation-id`
- **Format:** UUID v4 or high-entropy cryptographic nonce (`req_1792223044...`).
- **Propagation:** Stamped onto all outbound audit logs, clinical event records, error payloads, and payment reconciliation logs.
- **Traceability:** Enables tracing an encounter from:
  $$\text{Patient Check-In} \longrightarrow \text{Doctor Consultation} \longrightarrow \text{Prescription Approval} \longrightarrow \text{Order Payment}$$
  under a single correlated audit trail.

---

## 3. Sensitive Data Scrubbing Rules

To comply with healthcare privacy regulations and data minimization standards, the logging pipeline automatically scrubs all level 5 and level 3 sensitive data before persisting to log streams:

| Category | Field Names Scrubbed | Replacement Token |
|---|---|---|
| **Credentials** | `password`, `newPassword`, `currentPassword`, `pin` | `[REDACTED_PASSWORD]` |
| **Tokens & Secrets** | `token`, `jwt`, `secret`, `apiKey`, `authorization`, `signature` | `[REDACTED_SECRET]` |
| **Payment Secrets** | `cvv`, `cardNumber`, `accountNumber`, `vpa` | `[REDACTED_FINANCIAL]` |
| **Personal Identifiers** | In AI logs: `phone`, `email`, `streetAddress` | `[REDACTED_PII]` |

---

## 4. Key Metrics & Telemetry Indicators

| Metric Indicator | Collection Point | Healthy Baseline | Warning Threshold | Critical Threshold |
|---|---|---|---|---|
| **API Request Latency ($P_{95}$)** | Express Middleware | $< 120\text{ms}$ | $> 350\text{ms}$ | $> 1000\text{ms}$ |
| **HTTP 5xx Error Rate** | Error Handler | $< 0.05\%$ | $> 1\%$ | $> 5\%$ |
| **Authentication Failure Rate**| `/api/auth/login` | $< 2/\text{min}$ | $> 10/\text{min}$ | $> 30/\text{min}$ (Brute force) |
| **Database Pool State** | Mongoose Connection | `readyState = 1` | `readyState = 2` | `readyState = 0` (Outage) |
| **Payment Reconciliation Lag** | Scheduler Task | $0\text{ pending} > 5\text{m}$ | $1 - 3\text{ uncommitted}$| $> 5\text{ orphaned orders}$ |
| **AI Extraction Fallbacks** | `aiService.js` | $< 5\%$ | $> 15\%$ | $> 40\%$ |
| **Inventory Oversell Attempts** | `inventoryService.js` | $0$ | $> 0$ | High race frequency |

---

## 5. Standard Health Probes

TriMedi provides three standardized HTTP telemetry probes for container orchestration (Kubernetes, Docker Swarm, AWS ECS):

### 1. `GET /live` (Liveness Probe)
- **Purpose:** Verifies that the Node.js process event loop is active and responsive.
- **Response:**
  ```json
  {
    "status": "ALIVE",
    "uptimeSeconds": 240,
    "timestamp": "2026-10-17T07:43:50.518Z"
  }
  ```
- **Action on Failure:** Orchestrator restarts the unresponsive container.

### 2. `GET /ready` (Readiness Probe)
- **Purpose:** Verifies that the application is ready to accept production traffic (database connection established).
- **Response (Healthy):**
  ```json
  {
    "status": "READY",
    "mode": "production",
    "database": "connected",
    "securityStore": "PRODUCTION_DISTRIBUTED_ACTIVE",
    "timestamp": "2026-10-17T07:43:50.529Z"
  }
  ```
- **Response (Unready - HTTP 503):**
  ```json
  {
    "status": "NOT_READY",
    "code": "DATABASE_UNAVAILABLE",
    "message": "Database connection is not ready to serve production healthcare traffic."
  }
  ```
- **Action on Failure:** Load balancer temporarily routes traffic away from this container until ready.

### 3. `GET /health` (Internal System Health)
- **Purpose:** Comprehensive operational health breakdown for authorized monitoring dashboards.
- **Sanitization Guarantee:** Contains zero passwords, database credentials, or API secrets.

---

## 6. Alerting Escalation Matrix & Ownership

| Incident Category | Severity | Detection Mechanism | Automated Action | Primary Owner | Escalation (15m) |
|---|---|---|---|---|---|
| **Database Outage (503)** | P1 (Critical) | `/ready` fails 3x consecutively | Auto-switch traffic | Lead DevSecOps | CTO / VP Eng |
| **Payment Webhook Failure** | P1 (Critical) | Signature mismatch spike ($> 5$) | Alert on Slack #alerts | Lead Backend | FinOps Lead |
| **Mass Account Lockout** | P2 (High) | 20+ IP lockout events in 5m | IP rate limit tighten | Security Architect | Lead DevSecOps |
| **Break-Glass Invocation** | P2 (High) | `BREAK_GLASS_INVOKED` event | Audit record emitted | Chief Medical Officer| Security Lead |
| **High Prompt Injection Rate** | P3 (Medium) | `AI_PROMPT_INJECTION` ($> 10$) | Model throttle | ML/AI Engineer | Security Team |
| **Slow API Queries** | P3 (Medium) | Latency $> 500\text{ms}$ | Profile slow query | Backend Team | Lead DevSecOps |
