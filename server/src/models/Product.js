import mongoose from "mongoose";
import slugify from "slugify";
import crypto from "crypto";

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: String, alt: String },
  { _id: false }
);

// Prices are in PAISE (integer). Rs 3,999 = 399900
const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, uppercase: true },
  size: String,
  color: String,
  storage: String,
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0, default: null },
  stock: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
});

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 5000 },
    brand: { type: String, required: true, trim: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: { type: [imageSchema], default: [] },
    specs: [{ _id: false, key: String, value: String }],
    tags: [{ type: String, lowercase: true, trim: true }],
    variants: {
      type: [variantSchema],
      validate: [(v) => v.length > 0, "At least one variant is required"],
    },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    isFeatured: { type: Boolean, default: false },

    // auto-calculated (don't set by hand)
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },

    // updated by the reviews/orders system later
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre("validate", function () {
  // slug: readable + short random suffix so same titles never clash
  if (this.isNew && !this.slug) {
    const base = slugify(this.title, { lower: true, strict: true });
    this.slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;
  }

  this.variants.forEach((v, i) => {
    if (v.discountPrice != null && v.discountPrice > v.price) {
      this.invalidate(`variants.${i}.discountPrice`, "Discount price cannot be higher than price");
    }
  });

  if (this.variants.length) {
    const prices = this.variants.map((v) => v.discountPrice ?? v.price);
    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
    this.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
});

// Indexes for the shop page
productSchema.index({ status: 1, category: 1, minPrice: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, soldCount: -1 });
productSchema.index({ status: 1, avgRating: -1 });
productSchema.index({ "variants.sku": 1 }, { unique: true });
productSchema.index(
  { title: "text", brand: "text", tags: "text" },
  { weights: { title: 10, brand: 5, tags: 2 }, name: "product_text" }
);

export default mongoose.model("Product", productSchema);