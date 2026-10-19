# TriMedi Intelligent Healthcare Ecosystem
## Database Architecture, Schema Registry & Index Specification

**Document Reference:** `docs/database/DATABASE_ARCHITECTURE.md`  
**Classification:** Database Architecture & Data Engineering  
**Cluster Host:** `cluster0.j4elnei.mongodb.net`  
**Database Name:** `trimedi`  
**Status:** Authoritative & Verified (15 Collections, 115 Indexes)  

---

### 1. Database Architecture Overview

TriMedi utilizes a dedicated MongoDB Atlas replica set (`cluster0.j4elnei.mongodb.net`) running WiredTiger storage engine with AES-256 encryption at rest and TLS 1.3 in transit.

- **Authoritative Database:** `trimedi`
- **Application User:** Dedicated production user (`trimedi_prod`) with `readWrite` privileges.
- **Replica Set Configuration:** 3-node primary-secondary replica set with automated failover and multi-document ACID transaction support.
- **Non-Destructive Invariant:** Production data, clinical consultations, and confirmed orders are immutable to destructive resets.

---

### 2. The 15 Canonical Collections & Index Registry

TriMedi defines exactly 15 authoritative collections with 115 verified indexes:

| # | Collection Name | Mongoose Model | Active Indexes | Primary Relationships & Key Fields |
|---|---|---|---|---|
| 01 | `users` | `User` | 3 | `email` (unique), `role`, `licenseNumber`, `createdAt` |
| 02 | `appointments` | `Appointment` | 6 | `patientId` → `users`, `doctorId` → `users`, `date`, `status` |
| 03 | `clinicqueues` | `ClinicQueue` | 10 | `patientId` → `users`, `tokenNumber`, `queueStatus`, `priorityScore` |
| 04 | `consultations` | `Consultation` | 9 | `patientId` → `users`, `doctorId` → `users`, `appointmentId`, `vitals` |
| 05 | `prescriptions` | `Prescription` | 7 | `consultationId`, `doctorId`, `patientId`, `status` (`draft`/`active`) |
| 06 | `medications` | `Medication` | 9 | `patientId` → `users`, `prescriptionId`, `adherenceScore`, `refillAlert` |
| 07 | `products` | `Product` | 6 | `name`, `sku` (unique), `hsnCode`, `gstRate`, `stock`, `isPrescriptionRequired` |
| 08 | `orders` | `Order` | 15 | `patientId`, `prescriptionId`, `orderStatus`, `paymentStatus`, `paypalCaptureId` |
| 09 | `notifications` | `Notification` | 7 | `recipientId` → `users`, `channel`, `type`, `readStatus`, `dedupKey` |
| 10 | `conversations` | `Conversation` | 5 | `participants` → `users`, `lastMessageTimestamp`, `topic` |
| 11 | `messages` | `Message` | 5 | `conversationId`, `senderId`, `content`, `readBy` |
| 12 | `clinicalaudits` | `ClinicalAudit` | 12 | `entityType`, `entityId`, `actorId`, `action`, `sha256Hash` |
| 13 | `securityevents` | `SecurityEvent` | 5 | `severity`, `threatType`, `sourceIp`, `actorId`, `resolved` |
| 14 | `consents` | `Consent` | 5 | `patientId` → `users`, `purpose`, `version`, `granted` |
| 15 | `aiaudits` | `AIAudit` | 11 | `prescriptionId`, `modelProvider`, `confidenceScore`, `reviewerId` |

---

### 3. Collection Relationships (ERD)

```
        ┌──────────────┐
        │    users     │
        └──┬───┬───┬───┘
           │   │   │
     ┌─────┘   │   └───────────────────────┐
     ▼         ▼                           ▼
┌──────────────┐ ┌──────────────┐    ┌──────────────┐
│ appointments │ │ clinicqueues │    │   consents   │
└──────┬───────┘ └──────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐       ┌──────────────┐
│consultations │ ────> │prescriptions │ ────> aiaudits
└──────────────┘       └──────┬───────┘
                              │
               ┌──────────────┼──────────────┐
               ▼                             ▼
        ┌──────────────┐              ┌──────────────┐
        │ medications  │              │    orders    │ ──> products
        └──────────────┘              └──────────────┘
```

---

### 4. Operational Scripts & Data Lifecycle

#### A. Database Initialization (`npm run db:init`)
- File: [`backend/scripts/db_init.js`](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/backend/scripts/db_init.js)
- Action: Connects to MongoDB, synchronizes collection schemas, asserts index creation, and ensures replica set connectivity without dropping existing clinical records.

#### B. Pharmaceutical Catalog Seeding (`npm run db:seed`)
- File: [`backend/scripts/db_seed.js`](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/backend/scripts/db_seed.js)
- Action: Seeds the 50 canonical pharmaceutical products (Paracetamol, Amoxicillin, Metformin, Atorvastatin, etc.) using idempotent `bulkWrite` with `upsert: true`.

#### C. Database Verification (`npm run db:verify`)
- File: [`backend/scripts/db_verify.js`](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/backend/scripts/db_verify.js)
- Action: Verifies presence of all 15 collections, checks 115 indexes, runs clean probe CRUD lifecycle, validates multi-document ACID transactions, and asserts Mongoose schema validations.

#### D. Backup & Point-in-Time Restore (`backup_restore_drill.js`)
- File: [`backend/scripts/backup_restore_drill.js`](file:///Users/adityanikam/Desktop/TriMedi%20Capstone/S73_AdityaNikam_TriMedi_Capstone/backend/scripts/backup_restore_drill.js)
- Action: Generates JSON snapshot of all 15 collections with SHA-256 cryptographic hashes per entity; executes test recovery validating 100% hash consistency and zero broken references.
