import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

const validate = (schema: ZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);

      // Validated data ko request body mein replace karna
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
        return;
      }

      next(error);
    }
  };
};

export default validate;