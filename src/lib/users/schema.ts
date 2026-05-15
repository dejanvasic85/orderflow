import { z } from "zod";
import type { Database } from "@/lib/database.types";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];

export const updateUserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  active: z.boolean().optional(),
  role: z.enum(["admin", "staff", "user"]).optional(),
  notification_preferences: z.object({ email: z.boolean(), sms: z.boolean() }).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
