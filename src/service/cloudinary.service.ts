import type { UploadApiResponse } from "cloudinary";

import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";

export const uploadImageToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new ApiError(500, "Failed to upload image to Cloudinary")
          );
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

export const deleteImageFromCloudinary = async (
  publicId: string
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};