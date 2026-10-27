import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .select("name slug parent image")
    .sort("name")
    .lean();
  res.json({ success: true, data: categories });
});