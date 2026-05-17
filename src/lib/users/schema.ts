import { z } from "zod";
import type { Database } from "@/lib/database.types";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type UserWithEmailRow = Database["public"]["Views"]["users_with_email"]["Row"];

export type UserRole = Database["public"]["Enums"]["user_role"];

export const userRoles = ["admin", "staff", "user"] as const satisfies readonly UserRole[];

export type UserAccount = { id: string; name: string };

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  invite_accepted_at: string | null;
  role: UserRole;
  notification_preferences: { email: boolean; sms: boolean };
  created_at: string;
  updated_at: string;
  accounts: UserAccount[];
};

export const updateUserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  active: z.boolean().optional(),
  role: z.enum(userRoles).optional(),
  notification_preferences: z.object({ email: z.boolean(), sms: z.boolean() }).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  role: z.enum(userRoles),
  notification_preferences: z.object({ email: z.boolean(), sms: z.boolean() }),
  accountIds: z.array(z.uuid()),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
