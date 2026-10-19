# TriMedi Intelligent Healthcare Ecosystem
## Pharmacy Operations, Inventory & Fulfillment Specification

**Document Reference:** `docs/pharmacy/PHARMACY_OPERATIONS.md`  
**Classification:** E-Pharmacy Operations & Supply Chain  
**Status:** Implemented & Verified  

---

### 1. Authoritative Order Fulfillment State Machine

Every medicine order progresses through a strictly validated sequence of fulfillment states. Illegal state jumps (e.g. `NEW` → `DELIVERED`) are blocked by Mongoose schema hooks and route middleware.

```
┌────────────────────────────────────────────────────────┐
│                   Standard Lifecycle                   │
│                                                        │
│   PRESCRIPTION_REVIEW                                  │
│           │ (Prescription Authenticated)               │
│           ▼                                            │
│          NEW                                           │
│           │ (Payment Verified / COD Approved)          │
│           ▼                                            │
│        ACCEPTED                                        │
│           │ (Pharmacy Acknowledges Order)              │
│           ▼                                            │
│        PREPARING                                       │
│           │ (Medicines Picked & Batch Verified)        │
│           ▼                                            │
│         PACKED                                         │
│           │ (Tamper-Evident Bag Sealed)                │
│           ▼                                            │
│       DISPATCHED                                       │
│           │ (Handed to Logistics / Tracking Assigned)  │
│           ▼                                            │
│    OUT_FOR_DELIVERY                                    │
│           │ (Last-Mile Courier En Route)               │
│           ▼                                            │
│       DELIVERED                                        │
│           │ (Patient Signature / OTP Confirmed)        │
│           ▼                                            │
│       COMPLETED                                        │
└────────────────────────────────────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
  [ CANCELLED ]                   [ REJECTED ]
(Payment Failed /               (Stock Damaged /
Customer Cancelled)             Invalid Prescription)
```

---

### 2. Operational Rules & Guardrails

#### A. Prescription Validation Gate
- Orders containing Schedule H, H1, or X prescription medications must reference an active `prescriptionId`.
- The linked prescription must have:
  - `status: "active"`
  - `doctorApproval: true`
  - Registered Medical Practitioner (RMP) digital signature stamp.
- Orders attempting to purchase prescription medicines without an approved Rx fail validation with HTTP 422.

#### B. Inventory Concurrency & Stock Reservation
- Stock is atomically checked and reserved at order placement using MongoDB transactions.
- Concurrency equation enforced:
  $$\text{Available Stock} = \text{Total Inventory} - \text{Reserved Inventory} \ge 0$$
- In the event of order cancellation or rejection, reserved stock is atomically restored.

#### C. Expiry & Batch Management
- Products in the catalog maintain `expiryDate` and `batchNumber`.
- Dispensing logic disallows picking batches with $< 90\text{ days}$ remaining shelf life.

#### D. Authoritative Pricing & GST Taxation
- Product prices are locked to authoritative values in the `products` catalog.
- Invoicing breaks down:
  - Base catalog subtotal
  - CGST 6% + SGST 6% (intrastate) or IGST 12% (interstate)
  - Delivery charge
  - Final Grand Total

#### E. Fulfillment Tracking & Patient Telemetry
- Tracking IDs (`TRK-IN-<timestamp>`) are generated upon dispatch.
- Socket.IO broadcasts real-time state changes directly to the patient's order tracking dashboard.
- Upon transition to `DELIVERED`, the adherence engine creates dosage schedules in the patient's `medications` profile.
