import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError.js";

const errorMiddleware = (
  error: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode =
    error instanceof ApiError ? error.statusCode : 500;

  const message =
    error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(error instanceof ApiError && {
      errors: error.errors,
    }),
  });
};

export default errorMiddleware;