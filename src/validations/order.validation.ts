import { z } from "zod";

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID");

// Order Item Validation
const orderItemSchema = z.object({
  product: objectIdSchema,

  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(100, "Maximum quantity is 100"),
});

// Shipping Address Validation
const shippingAddressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),

  phone: z
    .string()
    .trim()
    .regex(
      /^[6-9]\d{9}$/,
      "Please provide a valid Indian phone number"
    ),

  addressLine1: z
    .string()
    .trim()
    .min(5, "Address is too short")
    .max(200, "Address cannot exceed 200 characters"),

  addressLine2: z
    .string()
    .trim()
    .max(200, "Address cannot exceed 200 characters")
    .optional(),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100, "City cannot exceed 100 characters"),

  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100, "State cannot exceed 100 characters"),

  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Postal code must be 6 digits"),

  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(100, "Country cannot exceed 100 characters")
    .default("India"),
});

// Create Order Validation
export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item")
    .max(50, "Maximum 50 different items are allowed"),

  shippingAddress: shippingAddressSchema,

  paymentMethod: z.enum(["cod", "razorpay"], {
    message: "Payment method must be COD or Razorpay",
  }),

  idempotencyKey: z
    .string()
    .trim()
    .min(16, "Invalid idempotency key")
    .max(100, "Idempotency key cannot exceed 100 characters"),
});

// Update Order Status Validation
export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
  ]),

  note: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters")
    .optional(),
});

// Cancel Order Validation
export const cancelOrderSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .min(3, "Cancellation reason is required")
    .max(500, "Reason cannot exceed 500 characters"),
});

// TypeScript Types
export type CreateOrderInput = z.infer<
  typeof createOrderSchema
>;

export type UpdateOrderStatusInput = z.infer<
  typeof updateOrderStatusSchema
>;

export type CancelOrderInput = z.infer<
  typeof cancelOrderSchema
>;