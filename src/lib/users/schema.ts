import { z } from "zod";
import type { Database } from "@/lib/database.types";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type UserWithEmailRow = Database["public"]["Views"]["users_with_email"]["Row"];

export type UserRole = Database["public"]["Enums"]["user_role"];

export const userRoles = ["admin", "staff", "user"] as const satisfies readonly UserRole[];

export const isAdmin = (role: UserRole): boolean => role === "admin";
export const isStaff = (role: UserRole): boolean => role === "staff";
export const isUser = (role: UserRole): boolean => role === "user";
export const isStaffOrAdmin = (role: UserRole): boolean => role === "admin" || role === "staff";

export type UserAccount = { id: string; name: string };

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  invite_accepted_at: string | null;
  invited_at: string | null;
  role: UserRole;
  notificationPreferences: { email: boolean; sms: boolean };
  created_at: string;
  updated_at: string;
  accounts: UserAccount[];
};

const auPhoneSchema = z
  .string()
  .regex(/^04\d{8}$/, "Mobile number must be 10 digits starting with 04")
  .nullable()
  .optional();

export const updateUserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).optional(),
  phone: auPhoneSchema,
  active: z.boolean().optional(),
  role: z.enum(userRoles).optional(),
  notificationPreferences: z.object({ email: z.boolean(), sms: z.boolean() }).optional(),
  accountIds: z.array(z.uuid()).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  phone: auPhoneSchema,
  role: z.enum(userRoles),
  notificationPreferences: z.object({ email: z.boolean(), sms: z.boolean() }),
  accountIds: z.array(z.uuid()),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserAccountsSchema = z.object({
  userId: z.uuid(),
  toAdd: z.array(z.uuid()),
  toRemove: z.array(z.uuid()),
});

export type UpdateUserAccountsInput = z.infer<typeof updateUserAccountsSchema>;
