# TriMedi Intelligent Healthcare Ecosystem
## Redis Production Readiness & Distributed Gating Specification

**Document Reference:** `docs/deployment/REDIS_PRODUCTION_READINESS.md`  
**Classification:** Infrastructure & Distributed Systems  
**Status:** Architecture Specified / In-Memory Fallback Gated  

---

### 1. Architectural Purpose & Multi-Instance Mandate

When TriMedi runs in a **single-instance** environment (e.g. local staging, single-node pilot), memory-backed data structures are acceptable. However, in a **clustered, multi-instance production environment**, in-memory stores lead to split-brain vulnerabilities, broken token blacklists, and inventory race conditions.

Redis is the authoritative distributed coordinator for:
1. **Cryptographic Token / Session Revocation:** Instantaneous cluster-wide JWT blacklisting.
2. **Distributed Sliding-Window Rate Limiting:** Coordinated request throttling across all ingress nodes.
3. **Socket.IO Real-Time Scaling:** Pub/Sub adapter broadcasting events to connected patients and clinics across multiple backend pods.
4. **Payment & Webhook Idempotency:** Distributed key-value locks preventing concurrent duplicate fulfillment.
5. **Distributed Inventory Locking:** Pessimistic/Optimistic locks during atomic stock commits.

---

### 2. Guardrail Enforcement: `SecurityStore`

TriMedi implements a fail-safe gating abstraction in [`backend/utils/securityStore.js`](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/backend/utils/securityStore.js):

- **Status Flag: `SINGLE_INSTANCE_ONLY` vs `DISTRIBUTED_ACTIVE`**
  - If `REDIS_URL` is omitted, the store defaults to memory structures and stamps telemetry with:
    ```json
    { "status": "SINGLE_INSTANCE_ONLY", "warning": "Do not run multiple instances without Redis" }
    ```
  - When `APP_ENV=production` and multiple container replicas are detected without a connected Redis instance, the health readiness probe `/ready` emits a warning or blocks traffic to prevent silent cross-instance state desynchronization.

---

### 3. Distributed Invariants & Redis Implementations

```
┌────────────────────────────────────────────────────────┐
│               Ingress API Gateway Pods                 │
│      [ Backend Pod 1 ]            [ Backend Pod 2 ]    │
└──────────────┬────────────────────────────┬────────────┘
               │                            │
               ▼                            ▼
┌────────────────────────────────────────────────────────┐
│            Redis Cluster / Primary-Replica             │
├────────────────────────────────────────────────────────┤
│ 1. Token Blacklist:   EXPIRE token:<hash> <ttl>        │
│ 2. Rate Limiting:     ZADD / ZREMRANGEBYSCORE / ZCARD  │
│ 3. Socket.IO Adapter: Redis Pub/Sub channels           │
│ 4. Idempotency Keys:  SETNX idempotency:<id> "LOCKED"  │
│ 5. Stock Mutexes:     Redlock / SET resource_id NX PX  │
└────────────────────────────────────────────────────────┘
```

#### A. Token Revocation
- **Key Pattern:** `blacklist:jwt:<sha256_token>`
- **TTL:** Set to remaining token lifetime.
- **Invariant:** `authMiddleware.js` checks Redis key before accepting request; revocation propagates in $< 5\text{ms}$.

#### B. Rate Limiting
- **Key Pattern:** `ratelimit:<ip>:<route>`
- **Algorithm:** Redis Sorted Sets (ZSET) with sliding-window millisecond timestamps.
- **Invariant:** Throttling is aggregate across all API nodes, preventing distributed brute-force attacks.

#### C. Payment Idempotency
- **Key Pattern:** `idempotency:paypal:<order_id>`
- **Operation:** `SET idempotency:paypal:<id> "PROCESSING" NX EX 60`
- **Invariant:** If key exists, second concurrent webhook/capture request receives immediate `isDuplicate: true`.

---

### 4. Configuration & Deployment Checklist

To activate distributed Redis in production:

1. Provision Redis 7+ cluster or managed AWS ElastiCache / Redis Cloud.
2. Inject environment variables:
   ```bash
   REDIS_URL=rediss://default:<password>@<redis_host>:6379
   REDIS_CLUSTER_MODE=true
   ```
3. Verify `/ready` probe outputs `"securityStore": "DISTRIBUTED_ACTIVE"`.
4. Run integration test verifying token revocation across two distinct ports.
