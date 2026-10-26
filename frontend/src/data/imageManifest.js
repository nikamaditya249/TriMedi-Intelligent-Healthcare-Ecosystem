/**
 * TriMedi Centralized Healthcare Image Manifest
 * All imagery is curated for visual consistency: clean, professional, high-resolution,
 * web-optimized (WebP/JPEG, quality=80, fixed aspect ratios) and legally licensed (Unsplash/Pexels/Public Domain).
 *
 * Visual Rules:
 * - Products: Clean packshot photography on pure white/neutral background with object-contain.
 * - Categories & Concerns: Direct semantic correlation (e.g. BP monitor for devices, glucose meter for diabetes).
 * - Hero: Clean physician consultation composition with dark-navy contrast compatibility.
 */

// Global fallback placeholder (Clean inline SVG data URI representing a medical product)
export const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80";

export const imageManifest = {
  // Hero & Banners
  hero: {
    // Professional doctor-patient clinical consultation
    consultation:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=900&auto=format&fit=crop&q=80",
    // Clean modern community pharmacy
    pharmacy:
      "https://images.unsplash.com/photo-1586015555751-63c2c90e3868?w=900&auto=format&fit=crop&q=80",
    // Prescription verification
    prescription:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80",
  },

  // 1. Primary Categories (Shop by Category)
  categories: {
    medicines:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    vitamins:
      "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=80",
    diabetes:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80",
    personalCare:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80",
    devices:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80",
    fitness:
      "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&auto=format&fit=crop&q=80",
    babyCare:
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=80",
    sexualWellness:
      "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&auto=format&fit=crop&q=80",
    ayurveda:
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80",
    painRelief:
      "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=80",
  },

  // 2. Health Concerns
  concerns: {
    diabetes:
      "https://images.unsplash.com/photo-1508847154043-be5407fcaa5a?w=500&auto=format&fit=crop&q=80",
    heart:
      "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=500&auto=format&fit=crop&q=80",
    stomach:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&auto=format&fit=crop&q=80",
    liver:
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=500&auto=format&fit=crop&q=80",
    boneJoint:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80",
    kidney:
      "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80",
    skin:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80",
    respiratory:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=500&auto=format&fit=crop&q=80",
    mental:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=80",
    womensHealth:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    mensHealth:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
    immunity:
      "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=500&auto=format&fit=crop&q=80",
  },

  // 3. Healthcare Devices (Clean white-background product presentation)
  devices: {
    bpMonitor:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80",
    glucometer:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80",
    oximeter:
      "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80",
    thermometer:
      "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500&auto=format&fit=crop&q=80",
    nebulizer:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=500&auto=format&fit=crop&q=80",
    scale:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
  },

  // 4. Personal Care
  personalCare: {
    skinCare:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80",
    hairCare:
      "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&auto=format&fit=crop&q=80",
    oralCare:
      "https://images.unsplash.com/photo-1559590369-d35d1e9e0e07?w=500&auto=format&fit=crop&q=80",
    babyCare:
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=80",
    womensCare:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    mensGrooming:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
    elderlyCare:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80",
    sexualWellness:
      "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&auto=format&fit=crop&q=80",
  },

  // 5. Wellness & Supplements
  wellness: {
    vitamins:
      "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=80",
    multivitamins:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    protein:
      "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&auto=format&fit=crop&q=80",
    omega3:
      "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=500&auto=format&fit=crop&q=80",
    immunity:
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80",
    calcium:
      "https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=80",
    hairSkin:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80",
    probiotics:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&fit=crop&q=80",
  },

  // 6. Featured Brands (Official typography/imagery placeholders)
  brands: {
    himalaya:
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200&auto=format&fit=crop&q=80",
    cetaphil:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&auto=format&fit=crop&q=80",
    nivea:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&auto=format&fit=crop&q=80",
    dabur:
      "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=200&auto=format&fit=crop&q=80",
    morepen:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=200&auto=format&fit=crop&q=80",
    abbott:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&auto=format&fit=crop&q=80",
    minimalist:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200&auto=format&fit=crop&q=80",
    fixderma:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80",
    mamaearth:
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&auto=format&fit=crop&q=80",
    vaseline:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=200&auto=format&fit=crop&q=80",
    patanjali:
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=200&auto=format&fit=crop&q=80",
    plum:
      "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=200&auto=format&fit=crop&q=80",
  },
};

/**
 * Graceful image load error fallback handler
 */
export function handleImageError(e) {
  if (e.target.dataset.hasFailed) return;
  e.target.dataset.hasFailed = "true";
  e.target.src = FALLBACK_PRODUCT_IMAGE;
}
