import { Router } from "express";

import {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
} from "../controllers/auth.controller.js";

import validate from "../middlewares/validate.middleware.js"
import authMiddleware from "../middlewares/auth.middleware.js";

import {
  registerSchema,
  loginSchema,
} from "../validations/auth.validation.js";

const router = Router();
router.post("/register",validate(registerSchema),register);
router.post("/login",validate(loginSchema),login);
router.post("/refresh-token",refreshAccessToken);
router.post("/logout",authMiddleware,logout);
router.get("/me",authMiddleware,getCurrentUser);

export default router;