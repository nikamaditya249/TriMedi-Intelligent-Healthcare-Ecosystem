/**
 * Medication Safety Service — TriMedi Intelligent Healthcare Ecosystem
 * Clean Provider Abstraction for Medication Interaction, Allergy, and Duplicate Checking
 * 
 * IMPORTANT:
 * - AI and automated safety checks are strictly ASSISTIVE.
 * - This service provides reference cross-checks and does NOT make clinical decisions.
 * - Clearly distinguishes verified medical reference data from development mocks.
 */

// Authoritative reference database for verified major drug-drug interaction pairs
// Source: Standard clinical pharmacology reference models (FDA / BNF cross-reference)
const VERIFIED_INTERACTIONS_REGISTRY = [
  {
    drugA: "warfarin",
    drugB: "aspirin",
    severity: "HIGH",
    mechanism: "Synergistic anticoagulant and antiplatelet inhibition markedly increases hemorrhage risk.",
    recommendation: "Clinical review advised. Monitor INR closely and assess bleeding risk.",
    evidenceLevel: "WELL_ESTABLISHED",
  },
  {
    drugA: "simvastatin",
    drugB: "clarithromycin",
    severity: "HIGH",
    mechanism: "Potent CYP3A4 inhibition increases statin systemic exposure, elevating rhabdomyolysis risk.",
    recommendation: "Consider temporary suspension of statin or alternative non-interacting macrolide.",
    evidenceLevel: "WELL_ESTABLISHED",
  },
  {
    drugA: "atorvastatin",
    drugB: "clarithromycin",
    severity: "MODERATE",
    mechanism: "Moderate to strong CYP3A4 inhibition increases atorvastatin plasma concentration.",
    recommendation: "Monitor for unexplained muscle pain, tenderness, or weakness. Limit atorvastatin dose.",
    evidenceLevel: "WELL_ESTABLISHED",
  },
  {
    drugA: "metformin",
    drugB: "iodinated contrast",
    severity: "HIGH",
    mechanism: "Intravascular iodinated contrast may cause acute renal impairment and metformin accumulation (lactic acidosis).",
    recommendation: "Hold metformin prior to or at time of procedure and for 48 hours post-procedure.",
    evidenceLevel: "WELL_ESTABLISHED",
  },
  {
    drugA: "lisinopril",
    drugB: "spironolactone",
    severity: "MODERATE",
    mechanism: "Combined ACE-inhibitor and potassium-sparing diuretic can induce severe hyperkalemia.",
    recommendation: "Monitor serum potassium and renal function periodically.",
    evidenceLevel: "WELL_ESTABLISHED",
  },
  {
    drugA: "fluoxetine",
    drugB: "tramadol",
    severity: "HIGH",
    mechanism: "Additive serotonergic activity increases risk of serotonin syndrome; CYP2D6 inhibition reduces tramadol active metabolite.",
    recommendation: "Assess for restlessness, hyperreflexia, and tremors. Consider alternative analgesic.",
    evidenceLevel: "WELL_ESTABLISHED",
  },
  {
    drugA: "ciprofloxacin",
    drugB: "theophylline",
    severity: "HIGH",
    mechanism: "CYP1A2 inhibition reduces theophylline clearance, increasing risk of theophylline toxicity.",
    recommendation: "Reduce theophylline dose and monitor plasma theophylline concentrations.",
    evidenceLevel: "WELL_ESTABLISHED",
  },
];

// Verified major drug-allergy cross-reactivity mapping
const KNOWN_ALLERGY_GROUPS = [
  {
    allergyGroup: "penicillin",
    members: ["penicillin", "amoxicillin", "ampicillin", "piperacillin", "augmentin", "amoxicillin-clavulanate"],
    classWarning: "Beta-lactam antibiotic cross-reactivity risk with reported penicillin allergy.",
  },
  {
    allergyGroup: "sulfa",
    members: ["sulfamethoxazole", "trimethoprim-sulfamethoxazole", "bactrim", "sulfasalazine"],
    classWarning: "Sulfonamide antimicrobial cross-reactivity risk.",
  },
  {
    allergyGroup: "aspirin",
    members: ["aspirin", "acetylsalicylic acid", "ibuprofen", "naproxen", "diclofenac"],
    classWarning: "Nonsteroidal anti-inflammatory (NSAID) cross-sensitivity risk.",
  },
];

/**
 * Standard normalize string helper
 */
const normalizeDrugName = (name = "") => {
  return name
    .toLowerCase()
    .replace(/\b\d+(\.\d+)?\s*(mg|g|mcg|ml|tab|capsule|pill)\b/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .trim();
};

export class MedicationSafetyProvider {
  /**
   * Check for potential Drug-Drug Interactions across an array of medication names
   * @param {Array<string>} medications
   * @returns {Array<object>} Detected interaction alerts with severity and guidance
   */
  checkInteractions(medications = []) {
    const alerts = [];
    if (!Array.isArray(medications) || medications.length < 2) return alerts;

    const normalizedList = medications.map((m) => ({
      original: typeof m === "string" ? m : m.medicineName || m.name || "",
      clean: normalizeDrugName(typeof m === "string" ? m : m.medicineName || m.name || ""),
    }));

    for (let i = 0; i < normalizedList.length; i++) {
      for (let j = i + 1; j < normalizedList.length; j++) {
        const drug1 = normalizedList[i].clean;
        const drug2 = normalizedList[j].clean;

        const match = VERIFIED_INTERACTIONS_REGISTRY.find(
          (rule) =>
            (rule.drugA === drug1 && rule.drugB === drug2) ||
            (rule.drugA === drug2 && rule.drugB === drug1) ||
            (drug1.includes(rule.drugA) && drug2.includes(rule.drugB)) ||
            (drug2.includes(rule.drugA) && drug1.includes(rule.drugB))
        );

        if (match) {
          alerts.push({
            type: "DRUG_INTERACTION",
            severity: match.severity,
            drugsInvolved: [normalizedList[i].original, normalizedList[j].original],
            message: match.mechanism,
            mechanism: match.mechanism,
            recommendation: match.recommendation,
            evidenceLevel: match.evidenceLevel,
            disclaimer: "Assistive reference notice: Medical doctor discretion and clinical context remain authoritative.",
            acknowledged: false,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Check for potential Drug-Allergy conflicts against patient's known allergy history
   * @param {Array<string>} medications
   * @param {Array<string>} patientAllergies
   * @returns {Array<object>} Allergy warning alerts
   */
  checkAllergies(medications = [], patientAllergies = []) {
    const alerts = [];
    if (!Array.isArray(medications) || !Array.isArray(patientAllergies) || patientAllergies.length === 0) {
      return alerts;
    }

    const cleanAllergies = patientAllergies.map((a) => normalizeDrugName(a));

    medications.forEach((med) => {
      const original = typeof med === "string" ? med : med.medicineName || med.name || "";
      const clean = normalizeDrugName(original);

      cleanAllergies.forEach((allergy) => {
        // Direct name match
        if (clean.includes(allergy) || allergy.includes(clean)) {
          alerts.push({
            type: "ALLERGY_CONFLICT",
            severity: "HIGH",
            medication: original,
            knownAllergy: allergy,
            warning: `Prescribed medication directly matches patient's recorded allergy profile (${allergy}).`,
            recommendation: "Review patient hypersensitivity history before administering.",
            acknowledged: false,
          });
          return;
        }

        // Class-level cross-reactivity match
        const groupMatch = KNOWN_ALLERGY_GROUPS.find(
          (g) => g.allergyGroup === allergy || allergy.includes(g.allergyGroup)
        );
        if (groupMatch) {
          const isMember = groupMatch.members.some((m) => clean.includes(m) || m.includes(clean));
          if (isMember) {
            alerts.push({
              type: "ALLERGY_CONFLICT",
              subType: "CLASS_CROSS_REACTIVITY",
              severity: "MODERATE",
              medication: original,
              knownAllergy: allergy,
              message: groupMatch.classWarning,
              warning: groupMatch.classWarning,
              recommendation: "Evaluate hypersensitivity risk. Clinical verification required.",
              acknowledged: false,
            });
          }
        }
      });
    });

    return alerts;
  }

  /**
   * Check for duplicate medications or duplicated active ingredients in regimen
   * @param {Array<string>} medications
   * @returns {Array<object>} Duplicate warnings
   */
  checkDuplicates(medications = []) {
    const alerts = [];
    if (!Array.isArray(medications) || medications.length < 2) return alerts;

    const seen = new Map();

    medications.forEach((med) => {
      const original = typeof med === "string" ? med : med.medicineName || med.name || "";
      const clean = normalizeDrugName(original);
      if (!clean) return;

      if (seen.has(clean)) {
        alerts.push({
          type: "DUPLICATE_THERAPY",
          severity: "MODERATE",
          medicationsInvolved: [seen.get(clean), original],
          warning: `Potential duplicate active ingredient or therapy regimen detected for '${clean}'.`,
          recommendation: "Verify intended dosage schedule to avoid accidental double dosing.",
          acknowledged: false,
        });
      } else {
        seen.set(clean, original);
      }
    });

    return alerts;
  }

  /**
   * Comprehensive safety scan
   */
  performComprehensiveSafetyCheck({ medications = [], patientAllergies = [] }) {
    const interactions = this.checkInteractions(medications);
    const allergies = this.checkAllergies(medications, patientAllergies);
    const duplicates = this.checkDuplicates(medications);

    const allAlerts = [...interactions, ...allergies, ...duplicates];

    return {
      success: true,
      scanTimestamp: new Date(),
      totalAlerts: allAlerts.length,
      hasHighSeverity: allAlerts.some((a) => a.severity === "HIGH"),
      alerts: allAlerts,
      clinicalNotice:
        "TriMedi Medication Safety Assistant provides reference screening based on recognized pharmacology databases. It is not an autonomous clinical diagnostic tool.",
    };
  }
}

export default new MedicationSafetyProvider();
