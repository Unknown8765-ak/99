import { Router } from "express";

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getActiveProducts,
  getProductBySlug,
  getSimilarProducts
} from "../controllers/product.controller.js";

import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validation.js";

const router = Router();

// Public routes
router.get("/active", getActiveProducts);
router.get("/slug/:slug", getProductBySlug);

// Admin routes
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validate(createProductSchema),
  createProduct
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllProducts
);

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getProductById
);

router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteProduct
);
router.get("/:id/similar",authMiddleware, getSimilarProducts);

export default router;