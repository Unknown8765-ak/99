import { Router } from "express";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  trackOrder,
  createExchangeRequest,
  getExchangeRequestStatus
} from "../controllers/order.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/",authMiddleware, createOrder);
router.get("/",authMiddleware, getMyOrders);
router.get("/:orderId/track", authMiddleware, trackOrder);
router.get("/:orderId",authMiddleware, getOrderById);
router.patch("/:orderId/cancel",authMiddleware, cancelOrder);
router.post("/:orderId/exchange",authMiddleware,createExchangeRequest);
router.get("/:orderId/exchange",authMiddleware,getExchangeRequestStatus);

export default router;