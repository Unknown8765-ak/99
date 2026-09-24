import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";


export const getWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized.");
    }

    const wishlist = await Wishlist.findOne({
      user: userId,
    }).populate({
      path: "products",
      match: {
        isActive: true,
      },
      select:
        "name slug description category images price stock sku isActive createdAt updatedAt",
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    if (!wishlist) {
      return res.status(200).json(
        new ApiResponse(
          200,
          [],
          "Wishlist is empty."
        )
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        wishlist.products,
        "Wishlist fetched successfully."
      )
    );
  }
);

export const addToWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const productId = Array.isArray(req.params.productId)
  ? req.params.productId[0]
  : req.params.productId;

    if (!userId) {
      throw new ApiError(401, "Unauthorized.");
    }
    
    if (
      !productId ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      throw new ApiError(400, "Invalid product ID.");
    }

    // Check product exists and is active
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    }).select("_id");

    if (!product) {
      throw new ApiError(
        404,
        "Product not found or inactive."
      );
    }

    // Create wishlist if it doesn't exist.
    // $addToSet prevents duplicate products.
    const wishlist = await Wishlist.findOneAndUpdate(
      {
        user: userId,
      },
      {
        $addToSet: {
          products: product._id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        wishlist,
        "Product added to wishlist."
      )
    );
  }
);

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const productId = Array.isArray(req.params.productId)
  ? req.params.productId[0]
  : req.params.productId;

    if (!userId) {
      throw new ApiError(401, "Unauthorized.");
    }

    if (
      !productId ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      throw new ApiError(400, "Invalid product ID.");
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      {
        user: userId,
      },
      {
        $pull: {
          products: productId,
        },
      },
      {
        new: true,
      }
    );

    if (!wishlist) {
      throw new ApiError(404, "Wishlist not found.");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        wishlist,
        "Product removed from wishlist."
      )
    );
  }
);