import { Router } from "express";

import {
  getMyProfile,
  updateMyProfile,
  changePassword,
} from "../controllers/adminProfile.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = Router();

router.get("/",authMiddleware,adminMiddleware,getMyProfile);
router.patch("/",authMiddleware,adminMiddleware,updateMyProfile);
router.patch("/password",authMiddleware,adminMiddleware,changePassword);

export default router;