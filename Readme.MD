# TriMedi — Connected Healthcare & Medication Intelligence Platform

[![TriMedi Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-teal?style=for-the-badge&logo=netlify)](https://trimedi.netlify.app/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-38bdf8?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-22c55e?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO%20Gateway-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47a248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

---

## 🌟 Executive Overview

**TriMedi** is an intelligent, real-time healthcare ecosystem that unites patients, certified doctors, licensed pharmacies, and administrators into a continuous care journey. Rather than functioning as an isolated pharmacy or telemedicine app, TriMedi links every touchpoint of treatment into an automated, proactive care lifecycle:

$$\text{Patient} \longleftrightarrow \text{Doctor} \longrightarrow \text{Appointment} \longrightarrow \text{Digital Prescription} \longrightarrow \text{Medicine} \longrightarrow \text{Checkout (PayPal/COD/UPI)} \longrightarrow \text{Supply Tracking} \longrightarrow \text{Refill Gap Detection} \longrightarrow \text{Order Again} \longrightarrow \text{Continued Care}$$

---

## 🚀 Key Features

### 1. Multi-Role Ecosystem & Workspaces
- **Patient Workspace**: Real-time medication supply bars, refill recommendations, digital prescription vault, appointment scheduling, consultation chat, and order tracking.
- **Doctor Clinical Portal (MD-Verified)**: Digital prescription issuer with dosage/frequency schedules, appointment calendar manager, and direct patient chat.
- **Pharmacy Dispensing Network**: Live order fulfillment queue with real-time status transitions (*Processing $\rightarrow$ Dispensed $\rightarrow$ Shipped $\rightarrow$ Delivered*), inventory control, and low-stock alerts.
- **Admin Governance Center**: System-wide telemetry, real-time WebSocket connection monitoring, background scheduler heartbeats, user directory, and audit logs.

### 2. Medication Supply Intelligence & Smart Refill Gap Engine
- **Deterministic Arithmetic Engine**: Evaluates prescribed duration (e.g., 30 Days) against actual purchased supply (e.g., 15 Days) on the backend to identify potential therapy shortage gaps.
- **Dynamic Supply Visualizers**: In-app progress bars showing exact days elapsed, days remaining, and refill thresholds.
- **Proactive Refill Alerts**: Generates non-alarmist notifications when medication supply approaches $\le 5$ days remaining.

### 3. Automated "Order Again" Engine
- **Prescription Validation**: Verifies that the prescription exists, belongs to the authenticated patient, and is currently active.
- **Authoritative Server Pricing**: Directly queries the live catalog database to compute subtotals, GST, and shipping—preventing client-side price tampering.
- **Direct Checkout Transfer**: Seamlessly transitions validated refill drafts into the checkout workflow for patient review and payment via **PayPal**, **COD**, or **UPI**.

### 4. Real-Time Doctor-Patient Consultation Chat
- **Socket.IO Gateway**: Authenticated real-time communication channel with room isolation (`user_${email}`, `conv_${conversationId}`).
- **Features**: Live message exchange, typing indicators, read receipts, online/offline presence indicators, and message history persistence.
- **Security**: Strict server-side validation ensuring users can only join conversations where they are authorized participants.

### 5. Event-Driven Real-Time Notification System
- **Centralized EventBus**: Internal domain event system (`APPOINTMENT_*`, `PRESCRIPTION_*`, `ORDER_*`, `REFILL_*`, `MESSAGE_*`).
- **Multi-Category Alerts**: Supports Appointments, Prescriptions, Orders, Payments, Medications, Refills, and Chat.
- **Notification Center Modal**: Live in-app toast popups, header unread badge counter, category filter pills, mark-as-read, and category preferences toggles.

### 6. AI-Assisted Clinical Communication (Assistive Only)
- **Instruction Simplifier**: Translates complex clinical instructions and Latin dosing terms (e.g. *OD Nocte post cibus*) into clear daily routines.
- **Doctor Query Drafter**: Helps patients clearly frame symptom questions and queries for doctor consultations.
- **Consultation Summarizer**: Generates concise action items and key highlights from past consultations.
- **Safety Boundaries**: Every AI response includes prominent medical disclaimers. AI never makes autonomous clinical decisions or alters prescriptions.

### 7. Background Healthcare Scheduler
- **60-Second In-Process Timer**: Runs automated health checks for:
  - 24-hour and 1-hour upcoming appointment reminders
  - Medication supplies approaching the 3-day refill threshold
- **Database-Backed Idempotency**: Persistent checks against MongoDB ensure server restarts never create duplicate notifications.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Socket.IO Client, React Router v6, React Icons, Context API |
| **Backend** | Node.js, Express.js (ES Modules), Socket.IO, EventEmitter, BcryptJS, JWT |
| **Database** | MongoDB Atlas / Mongoose (with dual-mode resilient local fallback) |
| **Payments** | PayPal Orders API v2 (Authoritative Server-Side Capture), Cash on Delivery (COD), UPI |
| **AI / NLP** | Google Gemini 1.5 Flash API / Deterministic Healthcare NLP Pipeline |
| **Deployment** | Netlify (Frontend), Node.js Cloud Hosting (Backend) |

---

## 📂 Project Architecture

```
S73_AdityaNikam_TriMedi_Capstone/
├── backend/
│   ├── data/                   # Default product catalog & seed data
│   ├── middleware/             # JWT & Session Authentication middlewares
│   ├── models/                 # Mongoose models (User, Order, Prescription, Appointment, Conversation, Message, Notification)
│   ├── routes/                 # REST API endpoints (auth, products, orders, prescriptions, appointments, chat, notifications, refill, ai, paypal)
│   ├── services/               # Socket.IO gateway, Domain EventBus, Background Scheduler
│   ├── index.js                # Server entry point with HTTP & Socket.IO listener
│   └── test_audit.js           # Automated Phase 3 security & persistence test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/             # AI Assistant modal & AI Scanner modal
│   │   │   ├── appointments/   # Booking consultation modals
│   │   │   ├── chat/           # Real-time chat window & message bubbles
│   │   │   ├── intelligence/   # Medication supply timeline & gap tracker
│   │   │   ├── layout/         # AppShell, Navbar, Header, Sidebar
│   │   │   ├── notifications/  # Notification center modal
│   │   │   ├── prescriptions/  # Digital prescription creation modals
│   │   │   ├── refill/         # Order Again validation modal
│   │   │   └── ui/             # Reusable design tokens (Button, Card, Badge, Modal, Avatar)
│   │   ├── context/            # AuthContext, CartContext, SocketContext
│   │   ├── pages/              # Landing, Auth, Products, Cart, Checkout, Profile, ChatPage
│   │   │   └── dashboards/     # PatientDashboard, DoctorDashboard, PharmacyDashboard, AdminDashboard
│   │   ├── App.jsx             # Route registry & Provider wrapping
│   │   └── main.jsx            # React root mount
│   └── package.json
└── Readme.MD
```

---

## ⚙️ Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas** connection string (optional; in-memory resilient fallback available)

### 1. Clone the Repository
```bash
git clone https://github.com/kalviumcommunity/S73_AdityaNikam_TriMedi_Capstone.git
cd S73_AdityaNikam_TriMedi_Capstone
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/trimedi?retryWrites=true&w=majority
JWT_SECRET=trimedi_secure_jwt_secret_2026
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173` and automatically connect to the backend Socket.IO gateway at `http://localhost:5001`.

---

## 🧪 Running Automated Tests & Security Audit

Run the Phase 3 security, persistence, and idempotency verification suite:
```bash
cd backend
node test_audit.js
```

### Audit Verification Checklist
- [x] Socket.IO connection authentication with cryptographic JWT verification
- [x] Prevention of role and identity spoofing
- [x] Conversation room authorization checks (preventing unauthorized eavesdropping)
- [x] REST API IDOR protection across conversations, prescriptions, and notifications
- [x] Durable MongoDB persistence surviving server restarts
- [x] Database-backed idempotent scheduler execution (0 duplicate alerts)
- [x] Authoritative server-side price computation for PayPal and Order Again checkouts
- [x] AI safety guardrails and clinical disclaimers

---

## 🌐 Live Deployment

- **Frontend Application**: [https://trimedi.netlify.app/](https://trimedi.netlify.app/)

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.# TriMedi-Intelligent-Healthcare-Ecosystem
