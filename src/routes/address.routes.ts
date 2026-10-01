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

router.use(authMiddleware);
router.post("/", createAddress);
router.get("/", getAddresses);
router.get("/:addressId", getAddressById);
router.delete("/:addressId", deleteAddress);
router.patch("/:addressId/default", setDefaultAddress);

export default router;