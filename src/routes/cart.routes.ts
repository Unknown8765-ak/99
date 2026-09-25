import { Router } from "express";

import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

const router = Router();

router.get("/",authMiddleware, getCart);
router.post("/",authMiddleware,addToCart);
router.patch("/item/:productId",authMiddleware,updateCartItem);
router.delete("/item/:productId",authMiddleware,removeFromCart);
router.delete("/clear",authMiddleware,clearCart);

export default router;