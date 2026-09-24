import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { env } from "../config/env.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";



const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
};



const generateAuthTokens = (userId: string) => {
  const accessToken = generateToken(
    { id: userId },
    env.ACCESS_TOKEN_SECRET,
    env.ACCESS_TOKEN_EXPIRY
  );

  const refreshToken = generateToken(
    { id: userId },
    env.REFRESH_TOKEN_SECRET,
    env.REFRESH_TOKEN_EXPIRY
  );

  return { accessToken, refreshToken };
};



export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
  } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: "customer",
  });
  console.log("user" ,user)

  // Generate tokens
  const { accessToken, refreshToken } = generateAuthTokens(
    user._id.toString()
  );

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("register")
  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        {
          user: createdUser,
          accessToken,
        },
        "User registered successfully"
      )
    );
});



export const login = asyncHandler(async (req, res) => {
  const {
    email,
    password,
  } = req.body;

  
  const user = await User.findOne({ email }).select(
    "+password +refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  // Compare password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = generateAuthTokens(
    user._id.toString()
  );

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("login")
  console.log("accessToken",accessToken)
  console.log("refresh",refreshToken)
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "Login successful"
      )
    );
});



export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & {
    user?: {
      id: string;
    };
  }).user?.id;

  if (userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: {
        refreshToken: 1,
      },
    });
  }
  console.log("logout")
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(200, null, "Logout successful")
    );
});



export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decodedToken: { id: string };

  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      env.REFRESH_TOKEN_SECRET
    ) as { id: string };
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decodedToken.id).select(
    "+refreshToken"
  );

  if (!user || !user.isActive) {
    throw new ApiError(401, "User not found or inactive");
  }

  // Check refresh token against database
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or revoked");
  }

  // Rotate tokens
  const {
    accessToken,
    refreshToken,
  } = generateAuthTokens(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken },
        "Access token refreshed successfully"
      )
    );
});



export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = (req as Request & {
    user?: {
      id: string;
    };
  }).user?.id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const user = await User.findById(userId).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user },
        "Current user fetched successfully"
      )
    );
});