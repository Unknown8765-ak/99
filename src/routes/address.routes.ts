import { Router } from "express";

import {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// All address routes require authentication
router.use(authMiddleware);

// Create a new address
router.post("/", createAddress);

// Get all logged-in user's addresses
router.get("/", getAddresses);

// Get single address
router.get("/:addressId", getAddressById);

// Update address
router.patch("/:addressId", updateAddress);

// Delete address
router.delete("/:addressId", deleteAddress);

// Set default address
router.patch("/:addressId/default", setDefaultAddress);

export default router;