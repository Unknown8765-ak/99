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
router.use(authMiddleware);

router.get("/", getCart);
router.post("/",addToCart);
router.patch("/item/:productId",updateCartItem);
router.delete("/item/:productId",removeFromCart);
router.delete("/clear",clearCart);

export default router;