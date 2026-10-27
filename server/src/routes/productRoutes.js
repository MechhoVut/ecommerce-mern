import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  getRelatedProducts,
  getProductFilters,
} from "../controllers/productController.js";

const router = Router();

router.get("/", getProducts);
router.get("/filters", getProductFilters);   // must be above /:slug
router.get("/:slug", getProductBySlug);
router.get("/:slug/related", getRelatedProducts);

export default router;