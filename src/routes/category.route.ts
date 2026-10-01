import { Router } from "express";

import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getActiveCategories,
} from "../controllers/category.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";



const router = Router();


router.get("/active", getActiveCategories);


router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createCategory
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllCategories
);

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getCategoryById
);

router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateCategory
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteCategory
);

export default router;