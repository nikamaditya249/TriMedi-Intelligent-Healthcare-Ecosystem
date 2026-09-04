import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("🚀 Script Started");

/* ===============================
   1. DATABASE CONNECTION
   =============================== */

const MONGO_URI = process.env.MONGO_URI || process.env.URL;

if (!MONGO_URI) {
  console.error("❌ Error: No MONGO_URI found in .env file!");
  process.exit(1);
}

try {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Database Connected");
} catch (err) {
  console.log("❌ DB Error:", err);
  process.exit(1);
}

/* ===============================
   2. SCHEMA
   =============================== */

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String
});

const Product = mongoose.model("Product", productSchema);

/* ===============================
   3. PRODUCTS (50 ITEMS)
   =============================== */

const products = [
  { name: "Paracetamol", price: 50, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Crocin", price: 60, image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=300" },
  { name: "Aspirin", price: 40, image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300" },
  { name: "Ibuprofen", price: 70, image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300" },
  { name: "Dolo 650", price: 80, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Vitamin C", price: 120, image: "https://m.media-amazon.com/images/I/61Q-+KR3WcL.jpg" },
  { name: "Calcium Tablets", price: 150, image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300" },
  { name: "Zinc Tablets", price: 110, image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300" },
  { name: "ORS Powder", price: 30, image: "https://images.unsplash.com/photo-1578496479531-32e296d5c6e1?w=300" },
  { name: "Digene", price: 90, image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=300" },
  { name: "Cetirizine", price: 25, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Benadryl", price: 95, image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300" },
  { name: "Vicks Vaporub", price: 140, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300" },
  { name: "Cough Syrup", price: 85, image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300" },
  { name: "Azithromycin", price: 200, image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=300" },
  { name: "Amoxicillin", price: 180, image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300" },
  { name: "Metformin", price: 130, image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300" },
  { name: "Insulin", price: 500, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300" },
  { name: "BP Monitor", price: 1500, image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300" },
  { name: "Glucometer", price: 1200, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300" },
  { name: "Thermometer", price: 250, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Pulse Oximeter", price: 900, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Sanitizer", price: 70, image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=300" },
  { name: "Face Mask", price: 150, image: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=300" },
  { name: "Dettol", price: 180, image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=300" },
  { name: "Savlon", price: 160, image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=300" },
  { name: "Bandage", price: 40, image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300" },
  { name: "Cotton", price: 60, image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300" },
  { name: "Gloves", price: 100, image: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=300" },
  { name: "Hot Water Bag", price: 200, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300" },
  { name: "Pain Spray", price: 220, image: "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=300" },
  { name: "Moov Gel", price: 130, image: "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=300" },
  { name: "Volini", price: 240, image: "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=300" },
  { name: "Eye Drops", price: 90, image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300" },
  { name: "Ear Drops", price: 85, image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300" },
  { name: "Nasal Spray", price: 140, image: "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=300" },
  { name: "Multivitamin", price: 180, image: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=300" },
  { name: "Protein Powder", price: 1200, image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300" },
  { name: "Electrolyte", price: 60, image: "https://images.unsplash.com/photo-1578496479531-32e296d5c6e1?w=300" },
  { name: "Herbal Tea", price: 200, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300" },
  { name: "Aloe Vera Gel", price: 150, image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=300" },
  { name: "Skin Cream", price: 220, image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300" },
  { name: "Face Wash", price: 180, image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300" },
  { name: "Shampoo", price: 250, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=300" },
  { name: "Hair Oil", price: 170, image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300" },
  { name: "Toothpaste", price: 90, image: "https://images.unsplash.com/photo-1559590369-d35d1e9e0e07?w=300" },
  { name: "Mouthwash", price: 160, image: "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=300" },
  { name: "Handwash", price: 140, image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=300" },
  { name: "Body Lotion", price: 300, image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300" },
  { name: "Baby Care Kit", price: 800, image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300" },
  { name: "Antacid Syrup", price: 75, image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300" },
  { name: "Iron Tablets", price: 95, image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300" },
  { name: "Folic Acid", price: 85, image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300" },
  { name: "Omega 3 Fish Oil", price: 350, image: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=300" },
  { name: "Vitamin D3", price: 200, image: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=300" },
  { name: "Vitamin B12", price: 220, image: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=300" },
  { name: "Probiotic Capsules", price: 280, image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300" },
  { name: "Cough Drops", price: 45, image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300" },
  { name: "Throat Spray", price: 160, image: "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=300" },
  { name: "Laxative Syrup", price: 90, image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300" },
  { name: "Antifungal Cream", price: 140, image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300" },
  { name: "Antibiotic Ointment", price: 120, image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300" },
  { name: "Betadine", price: 110, image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=300" },
  { name: "Hydrogen Peroxide", price: 60, image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=300" },
  { name: "Surgical Tape", price: 50, image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300" },
  { name: "Crepe Bandage", price: 80, image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300" },
  { name: "Ice Pack", price: 150, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300" },
  { name: "Knee Support", price: 450, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Wrist Band", price: 200, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Back Brace", price: 650, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300" },
  { name: "Neck Collar", price: 380, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300" },
  { name: "Nebulizer", price: 2500, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300" },
  { name: "Inhaler", price: 350, image: "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=300" },
  { name: "Stethoscope", price: 800, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Weighing Scale", price: 1200, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300" },
  { name: "Heating Pad", price: 700, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300" },
  { name: "Foot Cream", price: 180, image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300" },
  { name: "Lip Balm", price: 80, image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300" },
  { name: "Sunscreen SPF 50", price: 350, image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300" },
  { name: "After Sun Lotion", price: 280, image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300" },
  { name: "Mosquito Repellent", price: 190, image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=300" },
  { name: "Neem Face Pack", price: 130, image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=300" },
  { name: "Charcoal Mask", price: 160, image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300" },
  { name: "Hair Serum", price: 320, image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300" },
  { name: "Anti-Dandruff Shampoo", price: 270, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=300" },
  { name: "Conditioner", price: 240, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=300" },
  { name: "Dry Shampoo", price: 300, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=300" },
  { name: "Electric Toothbrush", price: 1800, image: "https://images.unsplash.com/photo-1559590369-d35d1e9e0e07?w=300" },
  { name: "Teeth Whitening Kit", price: 950, image: "https://images.unsplash.com/photo-1559590369-d35d1e9e0e07?w=300" },
  { name: "Dental Floss", price: 70, image: "https://images.unsplash.com/photo-1559590369-d35d1e9e0e07?w=300" },
  { name: "Baby Diapers", price: 600, image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300" },
  { name: "Baby Wipes", price: 150, image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300" },
  { name: "Baby Powder", price: 180, image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300" },
  { name: "Baby Shampoo", price: 200, image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300" },
  { name: "Gripe Water", price: 120, image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300" },
  { name: "Pregnancy Test Kit", price: 90, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "First Aid Kit", price: 550, image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300" },
  { name: "Wheelchair", price: 8500, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300" },
  { name: "Walking Stick", price: 400, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300" },
  { name: "Compression Socks", price: 350, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Collagen Supplement", price: 750, image: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=300" },
];

/* ===============================
   4. INSERT DATA
   =============================== */

try {
  console.log("🧹 Clearing old data...");
  await Product.deleteMany();

  console.log("📦 Inserting products...");
  await Product.insertMany(products);

  console.log("🎉 50 Products Inserted Successfully");
} catch (err) {
  console.log("❌ Insert Error:", err);
}


process.exit();