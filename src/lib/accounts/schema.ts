import { z } from "zod";
import type { Database } from "@/lib/database.types";

export type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];

export const createAccountSchema = z.object({
  name: z.string().min(1),
  contact_name: z.string().nullable().optional(),
  contact_email: z.email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export const updateAccountSchema = createAccountSchema.partial().extend({ id: z.uuid() });

export const assignSchema = z.object({
  account_id: z.uuid(),
  user_id: z.uuid(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AssignAccountUserInput = z.infer<typeof assignSchema>;
