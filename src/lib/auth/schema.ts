import { z } from "zod";
import { passwordRequirementsValue } from "@/lib/auth/passwordStrength";

export const passwordSchema = z
  .string()
  .refine(passwordRequirementsValue.minLength.test, "Password must be at least 8 characters")
  .refine(passwordRequirementsValue.lowercase.test, "Password must include a lowercase letter")
  .refine(passwordRequirementsValue.uppercase.test, "Password must include an uppercase letter")
  .refine(passwordRequirementsValue.number.test, "Password must include a number");

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
