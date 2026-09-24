import { z } from "zod";

// Common fields
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please provide a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password cannot exceed 128 characters");

// Register validation
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),

    email: emailSchema,

    password: passwordSchema,

    confirmPassword: z.string(),

    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Please provide a valid Indian phone number")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Login validation
export const loginSchema = z.object({
  email: emailSchema,

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password cannot exceed 128 characters"),
});

// Refresh token validation
// Refresh token cookie se aayega,
// isliye request body ki zaroorat nahi hai.
export const refreshTokenSchema = z.object({}).strict();

// Email verification validation
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, "Verification token is required"),
});

// Resend verification email validation
export const resendVerificationEmailSchema = z.object({
  email: emailSchema,
});

// TypeScript types
export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export type ResendVerificationEmailInput = z.infer<
  typeof resendVerificationEmailSchema
>;