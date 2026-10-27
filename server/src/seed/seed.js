import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

if (process.env.NODE_ENV === "production") {
  console.error("Seeding is blocked in production.");
  process.exit(1);
}

// placeholder images for now: replace with real photos that match each product
const img = (name) => [
  { url: `https://placehold.co/600x600?text=${encodeURIComponent(name)}`, alt: name },
];

const categoryData = [
  { name: "Electronics" },
  { name: "Fashion" },
  { name: "Home & Kitchen" },
  { name: "Books" },
];

// prices in paise
const products = [
  {
    title: "Wireless Noise-Cancelling Headphones", brand: "SoundMax", category: "Electronics",
    isFeatured: true, soldCount: 120, avgRating: 4.5, reviewCount: 86, tags: ["audio", "wireless"],
    description: "Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.",
    specs: [{ key: "Battery", value: "30 hours" }, { key: "Bluetooth", value: "5.3" }],
    variants: [
      { sku: "SM-HP-BLK", color: "Black", price: 499900, discountPrice: 399900, stock: 25 },
      { sku: "SM-HP-WHT", color: "White", price: 499900, discountPrice: 399900, stock: 10 },
    ],
  },
  {
    title: "Smart Watch Pro", brand: "TimeTech", category: "Electronics",
    isFeatured: true, soldCount: 90, avgRating: 4.2, reviewCount: 54, tags: ["wearable", "fitness"],
    description: "Fitness smartwatch with heart-rate tracking, GPS, and a bright AMOLED display.",
    specs: [{ key: "Display", value: "1.4 inch AMOLED" }, { key: "Water resistance", value: "5 ATM" }],
    variants: [
      { sku: "TT-SW-BLK", color: "Black", price: 799900, discountPrice: 649900, stock: 15 },
      { sku: "TT-SW-SLV", color: "Silver", price: 799900, stock: 8 },
    ],
  },
  {
    title: "Portable Bluetooth Speaker", brand: "SoundMax", category: "Electronics",
    soldCount: 60, avgRating: 4.0, reviewCount: 30, tags: ["audio", "speaker"],
    description: "Waterproof portable speaker with deep bass and 12-hour playtime.",
    variants: [{ sku: "SM-SP-RED", color: "Red", price: 249900, discountPrice: 199900, stock: 40 }],
  },
  {
    title: "Classic Cotton T-Shirt", brand: "UrbanWear", category: "Fashion",
    soldCount: 200, avgRating: 4.3, reviewCount: 120, tags: ["tshirt", "casual"],
    description: "Soft 100% cotton round-neck t-shirt for everyday wear.",
    variants: [
      { sku: "UW-TS-BLK-M", size: "M", color: "Black", price: 79900, discountPrice: 59900, stock: 50 },
      { sku: "UW-TS-BLK-L", size: "L", color: "Black", price: 79900, discountPrice: 59900, stock: 40 },
      { sku: "UW-TS-WHT-M", size: "M", color: "White", price: 79900, stock: 0 },
    ],
  },
  {
    title: "Running Sneakers", brand: "StrideX", category: "Fashion",
    isFeatured: true, soldCount: 75, avgRating: 4.6, reviewCount: 64, tags: ["shoes", "running"],
    description: "Lightweight breathable running shoes with cushioned soles.",
    variants: [
      { sku: "SX-RS-42", size: "42", color: "Grey", price: 299900, discountPrice: 249900, stock: 12 },
      { sku: "SX-RS-43", size: "43", color: "Grey", price: 299900, discountPrice: 249900, stock: 9 },
    ],
  },
  {
    title: "LED Desk Lamp", brand: "BrightHome", category: "Home & Kitchen",
    soldCount: 45, avgRating: 4.1, reviewCount: 22, tags: ["lamp", "study"],
    description: "Adjustable LED desk lamp with 3 brightness modes and USB charging port.",
    variants: [{ sku: "BH-DL-WHT", color: "White", price: 149900, discountPrice: 119900, stock: 30 }],
  },
  {
    title: "Non-Stick Cookware Set (5 pcs)", brand: "ChefMate", category: "Home & Kitchen",
    soldCount: 35, avgRating: 3.9, reviewCount: 18, tags: ["kitchen", "cookware"],
    description: "Five-piece non-stick cookware set suitable for gas and induction stoves.",
    variants: [{ sku: "CM-CW-5PC", price: 349900, discountPrice: 279900, stock: 18 }],
  },
  {
    title: "Clean Code (Paperback)", brand: "Pearson", category: "Books",
    soldCount: 150, avgRating: 4.7, reviewCount: 210, tags: ["programming", "book"],
    description: "A handbook of agile software craftsmanship by Robert C. Martin.",
    variants: [{ sku: "PE-CC-PB", price: 59900, discountPrice: 49900, stock: 100 }],
  },
];

const run = async () => {
  await connectDB();

  await Promise.all([Category.deleteMany(), Product.deleteMany()]);

  const cats = await Category.create(categoryData);
  const catId = Object.fromEntries(cats.map((c) => [c.name, c._id]));

  await Product.create(
    products.map((p) => ({
      ...p,
      category: catId[p.category],
      images: img(p.title),
      status: "active",
    }))
  );

  console.log(`Seeded ${cats.length} categories and ${products.length} products`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});