import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

type AuthRequest = Omit<Request, "user"> & {
  user?: {
    id: string;
  };
};

const authMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized: Token is missing");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      throw new ApiError(500, "JWT secret is not configured");
    }

    const decoded = jwt.verify(token, secret) as {
      id: string;
    };

    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(401, "Invalid or expired token")
    );
  }
};

export default authMiddleware;