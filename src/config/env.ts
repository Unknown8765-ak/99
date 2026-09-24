import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();



const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(8000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),

  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),

  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),

  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
  CLOUDINARY_CLOUD_NAME: z
  .string()
  .min(1, "Cloudinary cloud name is required"),

  CLOUDINARY_API_KEY: z
    .string()
    .min(1, "Cloudinary API key is required"),

  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "Cloudinary API secret is required"),

  EMAIL_USER: z
    .string()
    .min(1, "EMAIL_USER is required"),

  EMAIL_PASS: z
    .string()
    .min(1, "EMAIL_PASS secret is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten());
  process.exit(1);
}

export const env = parsedEnv.data;