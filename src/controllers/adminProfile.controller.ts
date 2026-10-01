import type { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

export const getMyProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new ApiError(401, "Unauthorized request");
    }

    const user = await User.findById(userId).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        user,
        "Profile fetched successfully"
      )
    );
  }
);

export const updateMyProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new ApiError(401, "Unauthorized request");
    }

    const { name, phone } = req.body;

    const updateData: {
      name?: string;
      phone?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No valid fields provided for update");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        user,
        "Profile updated successfully"
      )
    );
  }
);


export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new ApiError(401, "Unauthorized request");
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(
        400,
        "Current password and new password are required"
      );
    }

    if (newPassword.length < 8) {
      throw new ApiError(
        400,
        "New password must be at least 8 characters"
      );
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.comparePassword(
      currentPassword
    );

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Current password is incorrect");
    }

    user.password = newPassword;

    user.refreshToken = undefined;

    await user.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Password changed successfully"
      )
    );
  }
);