import { Router } from "express";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  trackOrder
} from "../controllers/order.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/",authMiddleware, createOrder);
router.get("/",authMiddleware, getMyOrders);
router.get("/:orderId/track", authMiddleware, trackOrder);
router.get("/:orderId",authMiddleware, getOrderById);
router.patch("/:orderId/cancel",authMiddleware, cancelOrder);

export default router;