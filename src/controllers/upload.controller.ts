import type { Request, Response } from "express";
import {
  uploadImageToCloudinary,
} from "../service/cloudinary.service.js";
import { Product } from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const uploadProductImages = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    // Check product ID
    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Get uploaded files
    const files = req.files as
      | Express.Multer.File[]
      | undefined;

    if (!files || files.length === 0) {
      throw new ApiError(
        400,
        "Please upload at least one image"
      );
    }

    // Upload images to Cloudinary
    const uploadedImages = await Promise.all(
      files.map((file) =>
        uploadImageToCloudinary(
          file.buffer,
          "99/products"
        )
      )
    );

    // Get only Cloudinary URLs
    const imageUrls = uploadedImages.map(
      (image) => image.secure_url
    );

    // Add new images to existing images
    product.images.push(...imageUrls);

    // Save product
    await product.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          productId: product._id,
          images: product.images,
        },
        "Product images uploaded successfully"
      )
    );
  }
);

