import { connectDatabase } from "./config/db";
import { Category } from "./models/Category";
import { Product } from "./models/Product";
import { User } from "./models/User";

const imageMap: Record<string, string> = {
  sarees: "/images/banarasi.png",
  "kurta-fabrics": "/images/chanderi.png",
  "dress-materials": "/images/jaipuri.png",
  "blouse-pieces": "/images/tussar.png",
  "cotton-fabrics": "/images/linen.png",
  electronics: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  home: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
  sports: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  offers: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=900&q=80",
};

const categoryImages: Record<string, string[]> = {
  electronics: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80",
  ],
  home: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1602874801006-e26ce6e08c88?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=900&q=80",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1590156455454-4dc2ad53f3d1?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=80",
  ],
  sports: [
    "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1518614368389-5160c0b0de72?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80",
  ],
  grocery: [
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1603046891744-1f76eb10aec5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1604908812868-50f9e6f964b8?auto=format&fit=crop&w=900&q=80",
  ],
  offers: [
    "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1578898887932-dce23a595ad4?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1577702312706-e23ff063064f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  ],
};

const categories = [
  { name: "Sarees", slug: "sarees", fabrics: ["Banarasi Silk", "Kanjivaram Silk", "Maheshwari Silk", "Handloom Silk"] },
  { name: "Kurta Fabrics", slug: "kurta-fabrics", fabrics: ["Chanderi Cotton", "Linen Cotton", "Rayon", "Khadi Cotton"] },
  { name: "Dress Materials", slug: "dress-materials", fabrics: ["Block-Print Cotton", "Georgette", "Modal Silk", "Ajrakh Cotton"] },
  { name: "Blouse Pieces", slug: "blouse-pieces", fabrics: ["Tussar Silk", "Brocade", "Raw Silk", "Cotton Silk"] },
  { name: "Cotton Fabrics", slug: "cotton-fabrics", fabrics: ["Pure Cotton", "Linen Cotton", "Mul Cotton", "Handloom Cotton"] },
  { name: "Electronics", slug: "electronics", fabrics: ["Mobile", "Audio", "Smart Watch", "Accessory"] },
  { name: "Home", slug: "home", fabrics: ["Decor", "Kitchen", "Storage", "Lighting"] },
  { name: "Beauty", slug: "beauty", fabrics: ["Skincare", "Makeup", "Haircare", "Fragrance"] },
  { name: "Sports", slug: "sports", fabrics: ["Fitness", "Outdoor", "Footwear", "Accessory"] },
  { name: "Grocery", slug: "grocery", fabrics: ["Organic", "Staples", "Snacks", "Beverage"] },
  { name: "Offers", slug: "offers", fabrics: ["Clearance", "Combo", "Festive Deal", "Limited Deal"] },
] as const;

const categoryProductNames: Record<string, string[]> = {
  electronics: [
    "Bluetooth Neckband",
    "Wireless Earbuds",
    "Smart Fitness Watch",
    "Fast Charging Adapter",
    "Braided USB-C Cable",
    "Portable Power Bank",
    "Mini Bluetooth Speaker",
    "Phone Camera Lens Kit",
    "Laptop Sleeve",
    "Wireless Mouse",
  ],
  home: [
    "Cotton Cushion Cover Set",
    "Ceramic Dinner Bowl Set",
    "Brass Table Lamp",
    "Handwoven Storage Basket",
    "Kitchen Spice Organizer",
    "Premium Bedsheet Set",
    "Scented Candle Trio",
    "Wall Art Frame",
    "Bath Towel Pair",
    "Wooden Serving Tray",
  ],
  beauty: [
    "Hydrating Face Serum",
    "Matte Lip Color Set",
    "Herbal Shampoo",
    "Aloe Vera Gel",
    "Rose Water Toner",
    "Daily Sunscreen SPF 50",
    "Kajal Pencil Duo",
    "Body Mist Collection",
    "Nourishing Hair Oil",
    "Face Wash Combo",
  ],
  sports: [
    "Yoga Mat Pro",
    "Resistance Band Set",
    "Running Shoes",
    "Stainless Steel Shaker",
    "Training Gloves",
    "Skipping Rope",
    "Dry Fit T-Shirt",
    "Gym Duffel Bag",
    "Trekking Bottle",
    "Badminton Racket",
  ],
  grocery: [
    "Organic Basmati Rice",
    "Cold Pressed Groundnut Oil",
    "Premium Almonds Pack",
    "Masala Chai Blend",
    "Whole Wheat Atta",
    "Jaggery Powder",
    "Roasted Snack Mix",
    "Filter Coffee Powder",
    "Natural Honey",
    "Dry Fruit Trail Mix",
  ],
  offers: [
    "Festive Textile Combo",
    "Beauty Starter Bundle",
    "Home Refresh Deal",
    "Electronics Value Pack",
    "Sports Essentials Kit",
    "Grocery Savings Box",
    "Weekend Saree Offer",
    "Kitchen Combo Offer",
    "Monsoon Care Bundle",
    "Clearance Super Deal",
  ],
};

const specialProducts = [
  ["Banarasi Silk Saree", "sarees", "Banarasi Silk", "/images/banarasi.png", 3499, 5999, "Wedding"],
  ["Kanjivaram Pure Silk Saree", "sarees", "Kanjivaram Silk", "/images/kanjivaram.png", 8999, 14999, "Wedding"],
  ["Maheshwari Handloom Saree", "sarees", "Maheshwari Silk", "/images/maheshwari.png", 2799, 4499, "Festive"],
  ["Chanderi Kurta Fabric", "kurta-fabrics", "Chanderi Cotton", "/images/chanderi.png", 899, 1499, "Festive"],
  ["Jaipuri Dress Material", "dress-materials", "Block-Print Cotton", "/images/jaipuri.png", 1199, 1999, "Daily"],
  ["Bandhani Georgette Dupatta Set", "dress-materials", "Georgette", "/images/bandhani.png", 799, 1299, "Festive"],
  ["Tussar Silk Blouse Piece", "blouse-pieces", "Tussar Silk", "/images/tussar.png", 649, 999, "Festive"],
  ["Handloom Linen Fabric", "cotton-fabrics", "Linen Cotton", "/images/linen.png", 1099, 1799, "Daily"],
] as const;

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const makeProduct = (
  name: string,
  category: string,
  fabric: string,
  imageUrl: string,
  price: number,
  mrp: number,
  stock: number,
  index: number,
  occasion = "Daily"
) => ({
  name,
  slug: slugify(name),
  description: `${name} from Grid Stores, selected for quality, finish, reliable value, and everyday usefulness.`,
  fabric,
  category,
  images: [{ url: imageUrl, publicId: `local/${slugify(name)}` }],
  price,
  mrp,
  stock,
  colors: ["Burgundy", "Gold", "Cream", "Charcoal"],
  care_instructions: category === "sarees" || category.includes("fabrics") || category.includes("pieces") || category.includes("materials")
    ? "Dry clean recommended. Store folded in a cool, dry place."
    : "Follow label instructions. Store in a cool, dry place.",
  occasion,
  ratings: { average: Number((4.2 + (index % 7) * 0.1).toFixed(1)), count: 8 + index },
  soldCount: 60 - index,
  isFeatured: index < 8,
  isActive: true,
});

const run = async () => {
  await connectDatabase();
  await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);

  await Category.insertMany(categories.map((category) => ({ name: category.name, slug: category.slug })));

  const products = specialProducts.map(([name, category, fabric, imageUrl, price, mrp, occasion], index) =>
    makeProduct(name, category, fabric, imageUrl, price, mrp, 12 + index * 3, index, occasion)
  );

  for (const category of categories) {
    const count = categoryProductNames[category.slug] ? 10 : 8;
    for (let index = 1; index <= count; index += 1) {
      const fabric = category.fabrics[index % category.fabrics.length];
      const price = categoryProductNames[category.slug]
        ? 199 + index * 145 + category.slug.length * 23
        : 650 + index * 210 + category.slug.length * 17;
      const name = categoryProductNames[category.slug]?.[index - 1] ?? `${category.name} Collection ${index}`;
      products.push(
        makeProduct(
          name,
          category.slug,
          fabric,
          categoryImages[category.slug]?.[index - 1] ?? imageMap[category.slug],
          price,
          price + 700 + index * 120,
          10 + index * 4,
          products.length,
          index % 2 === 0 ? "Festive" : "Daily"
        )
      );
    }
  }

  await Product.insertMany(products);

  const adminEmail = "admin@gridstores.local";
  const exists = await User.findOne({ email: adminEmail });
  if (!exists) {
    await User.create({ name: "Grid Admin", email: adminEmail, phone: "9876543210", password: "Admin@12345", role: "admin" });
  }

  console.log(`Seed complete. Added ${products.length} products with images. Admin: admin@gridstores.local / Admin@12345`);
  process.exit(0);
};

void run();
