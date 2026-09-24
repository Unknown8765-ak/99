import { Router } from "express";

import {
  uploadProductImages,
} from "../controllers/upload.controller.js";

import upload from "../middlewares/upload.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = Router();

router.post(
  "/product-images",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 5),
  uploadProductImages
);

export default router;