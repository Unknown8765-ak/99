import { z } from "zod";

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID");

// Create Product Validation
export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters"),

  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(180, "Slug cannot exceed 180 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers and hyphens"
    ),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  category: objectIdSchema,

  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one product image is required")
    .max(10, "Maximum 10 images are allowed"),

  price: z
    .number()
    .finite()
    .min(0, "Price cannot be negative"),

  stock: z
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .default(0),

  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(50, "SKU cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "SKU can contain only letters, numbers, hyphens and underscores"
    ),

  isActive: z.boolean().default(true),
});

// Update Product Validation
export const updateProductSchema = createProductSchema.partial();

// TypeScript Types
export type CreateProductInput = z.infer<
  typeof createProductSchema
>;

export type UpdateProductInput = z.infer<
  typeof updateProductSchema
>;