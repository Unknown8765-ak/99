import { Router } from "express";

import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
//   clearCart,
} from "../controllers/cart.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";



const router = Router();

// All cart routes require authentication
router.use(authMiddleware);

// Get logged-in user's cart
router.get("/", getCart);

// Add product to cart
router.post(
  "/",
  addToCart
);

// Update cart item quantity
router.patch(
  "/item/:productId",
  updateCartItem
);

// Remove product from cart
router.delete(
  "/item/:productId",
  removeFromCart
);

// Clear entire cart
// router.delete(
//   "/clear",
//   clearCart
// );

export default router;