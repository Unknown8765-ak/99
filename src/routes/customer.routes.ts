import { Router } from "express";

import {
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
} from "../controllers/customer.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = Router();

router.get("/",authMiddleware,adminMiddleware,getAllCustomers);
router.get("/:id",authMiddleware,adminMiddleware,getCustomerById);
router.patch("/:id/status",authMiddleware,adminMiddleware,updateCustomerStatus);

export default router;