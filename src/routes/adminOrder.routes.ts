import { Router } from "express";

import {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
} from "../controllers/adminOrder.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllOrders
);


router.get(
  "/:orderId",
  authMiddleware,
  adminMiddleware,
  getAdminOrderById
);


router.patch(
  "/:orderId/status",
  authMiddleware,
  adminMiddleware,
  updateOrderStatus
);

export default router;