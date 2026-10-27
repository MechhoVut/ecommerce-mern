import { z } from "zod";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().optional(),          // category slug
  brand: z.string().trim().optional(),             // "Nike,Puma"
  minPrice: z.coerce.number().int().min(0).optional(), // paise
  maxPrice: z.coerce.number().int().min(0).optional(), // paise
  rating: z.coerce.number().min(0).max(5).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular", "rating"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const sortMap = {
  newest: { createdAt: -1 },
  price_asc: { minPrice: 1 },
  price_desc: { minPrice: -1 },
  popular: { soldCount: -1 },
  rating: { avgRating: -1, reviewCount: -1 },
};

const LIST_FIELDS = {
  title: 1, slug: 1, brand: 1, category: 1, images: 1,
  minPrice: 1, maxPrice: 1, avgRating: 1, reviewCount: 1,
  totalStock: 1, isFeatured: 1, createdAt: 1,
};

export const getProducts = asyncHandler(async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, rating, inStock, sort, page, limit } =
    listQuerySchema.parse(req.query);

  const filter = { status: "active" };

  if (q) filter.$text = { $search: q };
  if (brand) filter.brand = { $in: brand.split(",").map((b) => b.trim()) };
  if (rating) filter.avgRating = { $gte: rating };
  if (inStock === "true") filter.totalStock = { $gt: 0 };

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.minPrice = {};
    if (minPrice !== undefined) filter.minPrice.$gte = minPrice;
    if (maxPrice !== undefined) filter.minPrice.$lte = maxPrice;
  }

  if (category) {
    const cat = await Category.findOne({ slug: category, isActive: true }).select("_id");
    if (!cat) {
      return res.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }
    const children = await Category.find({ parent: cat._id }).select("_id");
    filter.category = { $in: [cat._id, ...children.map((c) => c._id)] };
  }

  const projection = { ...LIST_FIELDS, ...(q && { score: { $meta: "textScore" } }) };
  const sortBy = sort
    ? sortMap[sort]
    : q
    ? { score: { $meta: "textScore" } }
    : sortMap.newest;

  const [products, total] = await Promise.all([
    Product.find(filter, projection)
      .sort({ ...sortBy, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: "active" })
    .populate("category", "name slug parent")
    .lean();
  if (!product) throw new AppError("Product not found", 404);
  res.json({ success: true, data: product });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: "active" }).select("category");
  if (!product) throw new AppError("Product not found", 404);

  const related = await Product.find(
    { status: "active", category: product.category, _id: { $ne: product._id } },
    LIST_FIELDS
  )
    .sort({ soldCount: -1 })
    .limit(8)
    .lean();

  res.json({ success: true, data: related });
});

// brands + price range for the filter sidebar
export const getProductFilters = asyncHandler(async (req, res) => {
  const [brands, price] = await Promise.all([
    Product.distinct("brand", { status: "active" }),
    Product.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, min: { $min: "$minPrice" }, max: { $max: "$maxPrice" } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      brands: brands.sort(),
      priceRange: price[0] ? { min: price[0].min, max: price[0].max } : { min: 0, max: 0 },
    },
  });
});