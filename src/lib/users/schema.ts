import { z } from "zod";
import { passwordSchema } from "@/lib/auth/schema";
import type { Database } from "@/lib/database.types";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type UserWithEmailRow = Database["public"]["Views"]["users_with_email"]["Row"];

export type UserRole = Database["public"]["Enums"]["user_role"];

export const userRoles = ["admin", "staff", "user"] as const satisfies readonly UserRole[];

export const isUserRole = (value: string): value is UserRole =>
  userRoles.includes(value as UserRole);

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
  inviteAcceptedAt: string | null;
  invitedAt: string | null;
  role: UserRole;
  notificationPreferences: { email: boolean; sms: boolean };
  createdAt: string;
  updatedAt: string;
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

export const userPageSize = 20;

export const listUsersSearchSchema = z.object({
  q: z.string().optional(),
  role: z.enum(userRoles).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type ListUsersSearch = z.infer<typeof listUsersSearchSchema>;

export type PagedUsersResult = { users: User[]; total: number };

export const setUserPasswordSchema = z.object({
  userId: z.uuid(),
  password: passwordSchema,
});

export const updateOwnProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: auPhoneSchema,
  notificationPreferences: z.object({ email: z.boolean(), sms: z.boolean() }),
});

export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
