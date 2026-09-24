import type { Request, Response } from "express";

import {
  uploadImageToCloudinary,
} from "../service/cloudinary.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const uploadProductImages = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      throw new ApiError(400, "Please upload at least one image");
    }

    const uploadedImages = await Promise.all(
      files.map((file) =>
        uploadImageToCloudinary(file.buffer, "99/products")
      )
    );

    const images = uploadedImages.map((image) => ({
      url: image.secure_url,
      publicId: image.public_id,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        { images },
        "Product images uploaded successfully"
      )
    );
  }
);