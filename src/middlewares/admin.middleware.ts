import type { Request, Response, NextFunction } from "express";

import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const adminMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as Request & { user?: { id?: string } }).user?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const user = await User.findById(userId).select("role isActive");

    if (!user || !user.isActive) {
      throw new ApiError(401, "User not found or inactive");
    }

    if (user.role !== "admin") {
      throw new ApiError(403, "Admin access required");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default adminMiddleware;