import { Router } from "express";

import {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  getAllExchangeRequests,
  updateExchangeStatus
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

router.get(
  "/exchanges",
  authMiddleware,
  adminMiddleware,
  getAllExchangeRequests
);

router.patch(
  "/exchanges/:exchangeId/status",
  authMiddleware,
  adminMiddleware,
  updateExchangeStatus
);

export default router;