import express from "express";
import Prescription from "../models/Prescription.js";
import Order from "../models/Order.js";

const router = express.Router();

// GET /api/intelligence/supply-summary
router.get("/supply-summary", async (req, res) => {
  try {
    const { patientEmail = "aditya@trimedi.health" } = req.query;

    // Deterministic arithmetic models
    const activeMedications = [
      {
        id: "med-1",
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily (Night)",
        prescribedDuration: 30, // 30 days prescribed
        purchasedSupply: 15, // 15 days purchased
        supplyGap: 15, // 30 - 15 = 15 days gap
        daysRemaining: 4,
        refillSuggested: true,
        prescribedBy: "Dr. Sarah Jenkins, MD",
        category: "Cardiovascular",
        timeline: [
          { day: "Day 0", event: "Digital Prescription Signed (30 Days)", status: "Completed", date: "2026-08-28" },
          { day: "Day 1", event: "Ordered 15-Day Supply via MedPlus Pharmacy", status: "Completed", date: "2026-08-29" },
          { day: "Day 2", event: "Pharmacy Dispatched & Delivered", status: "Completed", date: "2026-08-30" },
          { day: "Day 11 (Today)", event: "Current Medication Cycle (4 Days Supply Left)", status: "Active", date: "2026-09-04" },
          { day: "Day 15 (Target)", event: "Predicted Supply Gap & Reorder Event", status: "Pending", date: "2026-09-08" },
          { day: "Day 30", event: "Prescription Duration Conclusion", status: "Upcoming", date: "2026-09-27" },
        ],
      },
      {
        id: "med-2",
        name: "Metformin HCl",
        dosage: "500mg",
        frequency: "Twice daily after meals",
        prescribedDuration: 60,
        purchasedSupply: 60,
        supplyGap: 0,
        daysRemaining: 42,
        refillSuggested: false,
        prescribedBy: "Dr. Rajesh Gupta, MD",
        category: "Diabetes Care",
        timeline: [
          { day: "Day 0", event: "Digital Prescription Signed (60 Days)", status: "Completed", date: "2026-08-10" },
          { day: "Day 2", event: "Fulfilled Full 60-Day Supply", status: "Completed", date: "2026-08-12" },
          { day: "Day 25 (Today)", event: "42 Days Supply Remaining", status: "Active", date: "2026-09-04" },
          { day: "Day 60", event: "Follow-up Consultation & Refill", status: "Upcoming", date: "2026-10-10" },
        ],
      },
    ];

    res.json({
      patientEmail,
      totalActiveMedications: activeMedications.length,
      itemsNeedingRefill: activeMedications.filter((m) => m.refillSuggested).length,
      activeMedications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
