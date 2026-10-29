/**
 * TriMedi Centralized Healthcare Image Mapping & Fallback Strategy
 * All images use reliable, secure HTTPS endpoints optimized with web-friendly query parameters.
 */

export const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80";

export const categoryImages = {
  // Hero & Banners
  heroDiscovery:
    "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=900&auto=format&fit=crop&q=80",
  prescriptionBanner:
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80",

  // 1. Primary Categories (Shop by Category)
  medicines:
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
  vitamins:
    "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400&auto=format&fit=crop&q=80",
  diabetes:
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&auto=format&fit=crop&q=80",
  personalCare:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
  devices:
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80",
  fitness:
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
  babyCare:
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&auto=format&fit=crop&q=80",
  sexualWellness:
    "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&auto=format&fit=crop&q=80",
  ayurveda:
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80",
  painRelief:
    "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&auto=format&fit=crop&q=80",

  // 2. Health Concerns
  diabetesCare:
    "https://images.unsplash.com/photo-1508847154043-be5407fcaa5a?w=400&auto=format&fit=crop&q=80",
  heartCare:
    "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400&auto=format&fit=crop&q=80",
  stomachCare:
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop&q=80",
  liverCare:
    "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&auto=format&fit=crop&q=80",
  boneJoint:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80",
  kidneyCare:
    "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=80",
  skinCare:
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
  respiratoryCare:
    "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&auto=format&fit=crop&q=80",
  mentalWellness:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&auto=format&fit=crop&q=80",
  womensHealth:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
  mensHealth:
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
  immunity:
    "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&auto=format&fit=crop&q=80",

  // 3. Featured Brands (Distinct brand imagery & packshots)
  brands: {
    himalaya: "/brands/Himalaya.png",
    minimalist: "/brands/minimalist.jpeg",
    nivea: "/brands/Nivea.jpeg",
    dabur: "/brands/Dabur.jpeg",
    fixderma: "/brands/Fixderma.jpeg",
    mamaearth: "/brands/Mamaearth.png",
    vaseline: "/brands/Vaseline.jpeg",
    patanjali: "/brands/Patanjali.png",
  },

  // 4. Personal Care
  personalCareCategories: {
    skinCare:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
    hairCare:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
    oralCare:
      "https://images.unsplash.com/photo-1559650656-5d1d42775659?w=400&auto=format&fit=crop&q=80",
    babyCare:
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&auto=format&fit=crop&q=80",
    womensCare:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
    mensGrooming:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    elderlyCare:
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&auto=format&fit=crop&q=80",
    sexualWellness:
      "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&auto=format&fit=crop&q=80",
  },

  // 5. Wellness & Supplements
  wellness: {
    vitamins:
      "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400&auto=format&fit=crop&q=80",
    multivitamins:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
    protein:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
    omega3:
      "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&auto=format&fit=crop&q=80",
    immunity:
      "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&auto=format&fit=crop&q=80",
    calcium:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80",
    hairSkin:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
    probiotics:
      "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&auto=format&fit=crop&q=80",
  },

  // 6. Healthcare Devices
  devicesCategories: {
    bpMonitors:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80",
    glucometers:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&auto=format&fit=crop&q=80",
    pulseOximeters:
      "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=80",
    thermometers:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&auto=format&fit=crop&q=80",
    nebulizers:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
    weighingScales:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80",
  },
};

/**
 * Graceful fallback image handler
 */
export function handleImageError(e) {
  if (e.target.src !== FALLBACK_PRODUCT_IMAGE) {
    e.target.src = FALLBACK_PRODUCT_IMAGE;
  }
}
