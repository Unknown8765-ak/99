import { Request, Response } from "express";
import mongoose from "mongoose";

import { Address } from "../models/address.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      type,
      isDefault,
    } = req.body;

    // If new address is default, remove previous default
    if (isDefault === true) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      user: userId,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      type,
      isDefault,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        address,
        "Address created successfully"
      )
    );
  }
);

export const getAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    const addresses = await Address.find({
      user: userId,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        addresses,
        "Addresses fetched successfully"
      )
    );
  }
);

export const getAddressById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.isValidObjectId(addressId)) {
      throw new ApiError(400, "Invalid address ID");
    }

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        address,
        "Address fetched successfully"
      )
    );
  }
);

export const updateAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.isValidObjectId(addressId)) {
      throw new ApiError(400, "Invalid address ID");
    }

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      type,
      isDefault,
    } = req.body;

    // If updated address becomes default
    if (isDefault === true) {
      await Address.updateMany(
        {
          user: userId,
          _id: { $ne: addressId },
          isDefault: true,
        },
        {
          $set: { isDefault: false },
        }
      );
    }

    address.fullName = fullName ?? address.fullName;
    address.phone = phone ?? address.phone;
    address.addressLine1 = addressLine1 ?? address.addressLine1;
    address.addressLine2 = addressLine2 ?? address.addressLine2;
    address.landmark = landmark ?? address.landmark;
    address.city = city ?? address.city;
    address.state = state ?? address.state;
    address.postalCode = postalCode ?? address.postalCode;
    address.country = country ?? address.country;
    address.type = type ?? address.type;
    address.isDefault = isDefault ?? address.isDefault;

    await address.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        address,
        "Address updated successfully"
      )
    );
  }
);

export const deleteAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.isValidObjectId(addressId)) {
      throw new ApiError(400, "Invalid address ID");
    }

    const address = await Address.findOneAndDelete({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Address deleted successfully"
      )
    );
  }
);

export const setDefaultAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.isValidObjectId(addressId)) {
      throw new ApiError(400, "Invalid address ID");
    }

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    // Remove default from all user's addresses
    await Address.updateMany(
      {
        user: userId,
        _id: { $ne: addressId },
      },
      {
        $set: { isDefault: false },
      }
    );

    address.isDefault = true;
    await address.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        address,
        "Default address updated successfully"
      )
    );
  }
);
