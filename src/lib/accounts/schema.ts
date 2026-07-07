import { z } from "zod";

export type Account = {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  userCount: number;
};

export type AccountUser = {
  userId: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; role: string | null } | null;
};

export const createAccountSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().nullable().optional(),
  contactEmail: z.email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  deliveryInstructions: z.string().nullable().optional(),
});

export const updateAccountSchema = createAccountSchema.partial().extend({ id: z.uuid() });

export const assignSchema = z.object({
  accountId: z.uuid(),
  userId: z.uuid(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AssignAccountUserInput = z.infer<typeof assignSchema>;

export const accountPageSize = 20;

export const listAccountsSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type ListAccountsSearch = z.infer<typeof listAccountsSearchSchema>;

export type PagedAccountsResult = { accounts: Account[]; total: number };
