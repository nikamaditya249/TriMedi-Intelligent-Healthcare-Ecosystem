import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Prescription from "../models/Prescription.js";
import Order from "../models/Order.js";
import Appointment from "../models/Appointment.js";
import Product from "../models/Product.js";

const router = express.Router();

// Fallback seed data for rich interactive dashboard experiences in Phase 1
const mockDashboardData = {
  patient: {
    stats: {
      activePrescriptions: 3,
      ongoingMedicines: 5,
      daysSupplyRemaining: 18,
      refillStatus: "On Track",
      totalOrders: 6,
    },
    activeMedications: [
      {
        id: "med-1",
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily (Night)",
        prescribedDuration: 30,
        purchasedSupply: 15,
        remainingDays: 4,
        refillSuggested: true,
        prescribedBy: "Dr. Sarah Jenkins",
        category: "Cardiovascular",
      },
      {
        id: "med-2",
        name: "Metformin HCl",
        dosage: "500mg",
        frequency: "Twice daily after meals",
        prescribedDuration: 60,
        purchasedSupply: 60,
        remainingDays: 42,
        refillSuggested: false,
        prescribedBy: "Dr. Rajesh Gupta",
        category: "Diabetes Care",
      },
      {
        id: "med-3",
        name: "Amoxicillin Trihydrate",
        dosage: "500mg",
        frequency: "3 times daily",
        prescribedDuration: 10,
        purchasedSupply: 10,
        remainingDays: 2,
        refillSuggested: false,
        prescribedBy: "Dr. Emily Chen",
        category: "Antibiotics",
      },
    ],
    prescriptions: [
      {
        id: "rx-9041",
        doctorName: "Dr. Sarah Jenkins, MD",
        doctorSpecialty: "Cardiology",
        date: "2026-08-28",
        diagnosis: "Dyslipidemia & Hypertension Review",
        status: "Active",
        itemCount: 2,
      },
      {
        id: "rx-8832",
        doctorName: "Dr. Rajesh Gupta",
        doctorSpecialty: "Endocrinology",
        date: "2026-08-10",
        diagnosis: "Type 2 Diabetes Routine Management",
        status: "Active",
        itemCount: 3,
      },
    ],
    recentOrders: [
      {
        id: "ORD-7741",
        date: "2026-08-29",
        itemsSummary: "Atorvastatin 20mg (x15 tabs), Multivitamin Plus (x30 tabs)",
        amount: 480,
        status: "Delivered",
      },
      {
        id: "ORD-7612",
        date: "2026-08-12",
        itemsSummary: "Metformin 500mg (x60 tabs), Blood Glucose Strips",
        amount: 720,
        status: "Delivered",
      },
    ],
    upcomingAppointments: [
      {
        id: "apt-1",
        doctorName: "Dr. Sarah Jenkins",
        specialty: "Cardiology Follow-up",
        date: "2026-09-12",
        time: "10:30 AM",
        type: "Video Consultation",
      },
    ],
  },
  doctor: {
    stats: {
      totalPatients: 142,
      prescriptionsIssued: 389,
      todayAppointments: 8,
      pendingReviews: 3,
    },
    todaySchedule: [
      {
        id: "apt-101",
        patientName: "Aditya Nikam",
        time: "10:30 AM",
        type: "Follow-up",
        reason: "Cardio Lipid Panel Review",
        status: "Confirmed",
      },
      {
        id: "apt-102",
        patientName: "Meera Sharma",
        time: "11:15 AM",
        type: "New Consultation",
        reason: "Recurrent Migraine & Aura",
        status: "Confirmed",
      },
      {
        id: "apt-103",
        patientName: "Robert Vance",
        time: "02:00 PM",
        type: "Prescription Renewal",
        reason: "Blood Pressure Check",
        status: "Scheduled",
      },
    ],
    recentPrescriptions: [
      {
        id: "rx-9041",
        patientName: "Aditya Nikam",
        diagnosis: "Dyslipidemia & Hypertension",
        medicinesCount: 2,
        date: "Today, 10:15 AM",
        status: "Active",
      },
      {
        id: "rx-9040",
        patientName: "Ananya Deshmukh",
        diagnosis: "Acute Bronchitis",
        medicinesCount: 3,
        date: "Yesterday",
        status: "Active",
      },
      {
        id: "rx-9039",
        patientName: "Vikram Malhotra",
        diagnosis: "Allergic Rhinitis",
        medicinesCount: 1,
        date: "Sep 02, 2026",
        status: "Active",
      },
    ],
    recentPatients: [
      { id: "p-1", name: "Aditya Nikam", age: 24, condition: "Hypertension", lastVisit: "2026-08-28" },
      { id: "p-2", name: "Meera Sharma", age: 31, condition: "Migraine", lastVisit: "2026-08-20" },
      { id: "p-3", name: "Robert Vance", age: 58, condition: "Type 2 Diabetes", lastVisit: "2026-08-15" },
    ],
  },
  pharmacy: {
    stats: {
      incomingOrders: 14,
      processingOrders: 6,
      dispensedToday: 28,
      lowStockAlerts: 4,
    },
    ordersQueue: [
      {
        id: "ORD-9912",
        customerName: "Pooja Reddy",
        prescriptionRef: "RX-9038 (Dr. Sarah Jenkins)",
        items: "Atorvastatin 20mg (x30), Aspirin 75mg (x30)",
        total: 560,
        status: "Processing",
        time: "15 mins ago",
      },
      {
        id: "ORD-9911",
        customerName: "Aditya Nikam",
        prescriptionRef: "RX-9041",
        items: "Atorvastatin 20mg (x15)",
        total: 240,
        status: "Ready for Pickup",
        time: "45 mins ago",
      },
      {
        id: "ORD-9908",
        customerName: "Karan Johar",
        prescriptionRef: "OTC Order",
        items: "Paracetamol 650mg, Vitamin C 500mg",
        total: 180,
        status: "Dispensed",
        time: "2 hours ago",
      },
    ],
    lowStockMedicines: [
      { id: "m-1", name: "Azithromycin 500mg", stock: 8, minThreshold: 30, category: "Antibiotics" },
      { id: "m-2", name: "Montelukast 10mg", stock: 12, minThreshold: 50, category: "Respiratory" },
      { id: "m-3", name: "Insulin Glargine Pen", stock: 3, minThreshold: 15, category: "Diabetes" },
      { id: "m-4", name: "Cetirizine 10mg", stock: 15, minThreshold: 100, category: "Antihistamine" },
    ],
  },
  admin: {
    stats: {
      totalUsers: 1240,
      totalPatients: 980,
      totalDoctors: 84,
      totalPharmacies: 36,
      totalOrders: 3410,
      totalMedicines: 50,
      systemHealth: "99.98% Operational",
    },
    recentActivity: [
      { id: "act-1", event: "New Doctor Onboarded", detail: "Dr. Sarah Jenkins, MD approved", time: "10 mins ago" },
      { id: "act-2", event: "Pharmacy Verification", detail: "MedPlus Prime Pharmacy updated license", time: "1 hour ago" },
      { id: "act-3", event: "System Backup", detail: "Automated MongoDB cluster snapshot completed", time: "3 hours ago" },
      { id: "act-4", event: "Security Audit", detail: "0 critical vulnerabilities detected", time: "6 hours ago" },
    ],
    userDirectory: [
      { id: "u-1", name: "Aditya Nikam", role: "patient", email: "aditya@trimedi.health", status: "Active" },
      { id: "u-2", name: "Dr. Sarah Jenkins", role: "doctor", email: "doctor@trimedi.health", status: "Verified" },
      { id: "u-3", name: "MedPlus Prime", role: "pharmacy", email: "pharmacy@trimedi.health", status: "Verified" },
      { id: "u-4", name: "System Admin", role: "admin", email: "admin@trimedi.health", status: "Active" },
    ],
  },
};

// GET dashboard statistics based on role
router.get("/dashboard", async (req, res) => {
  try {
    const role = (req.query.role || "patient").toLowerCase();
    const data = mockDashboardData[role] || mockDashboardData.patient;

    // If MongoDB is connected, optionally enhance with real counts
    if (mongoose.connection.readyState === 1) {
      try {
        const productCount = await Product.countDocuments();
        const userCount = await User.countDocuments();
        if (role === "admin") {
          data.stats.totalMedicines = productCount || data.stats.totalMedicines;
          data.stats.totalUsers = userCount || data.stats.totalUsers;
        }
      } catch (err) {
        console.warn("Stats query fallback:", err.message);
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
