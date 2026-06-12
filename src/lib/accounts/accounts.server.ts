import type { z } from "zod";
import { ensureSession } from "@/lib/auth/auth.functions";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  Account,
  AccountRow,
  assignSchema,
  createAccountSchema,
  updateAccountSchema,
} from "./schema";
import { accountPageSize } from "./schema";

type AccountListedRow = AccountRow & { account_users: { user_id: string }[] | null };

export function mapAccount(row: AccountListedRow): Account {
  return { ...row, userCount: row.account_users?.length ?? 0 };
}

const accountSelect =
  "id, name, contact_name, contact_email, contact_phone, delivery_address, delivery_instructions, created_at, updated_at, account_users!account_id ( user_id )" as const;

export async function fetchAccountsForCurrentUser() {
  const supabase = createSupabaseServerClient();
  const session = await ensureSession();
  const { data, error } = await supabase
    .from("account_users")
    .select("account:accounts(id, name)")
    .eq("user_id", session.id);
  if (error) return err({ message: error.message });
  const accounts = (data ?? [])
    .map((r) => r.account)
    .filter((a): a is { id: string; name: string } => a !== null);
  return ok(accounts);
}

type FetchAccountsFilters = {
  q?: string;
  page?: number;
};

export async function fetchAccounts(filters: FetchAccountsFilters = {}) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("accounts")
    .select(accountSelect, { count: "exact" })
    .order("name", { ascending: true });

  if (filters.q) {
    const safe = filters.q.replace(/[%_()]/g, "");
    query = query.ilike("name", `%${safe}%`);
  }

  if (filters.page !== undefined) {
    const from = (filters.page - 1) * accountPageSize;
    query = query.range(from, from + accountPageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) return err({ message: error.message });
  return ok({ accounts: (data ?? []).map((row) => mapAccount(row)), total: count ?? 0 });
}

export async function fetchAccount(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(accountSelect)
    .eq("id", id)
    .single();
  if (error) return err({ message: error.message });
  return ok(mapAccount(data as AccountListedRow));
}

export async function fetchAccountUsers(accountId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("account_users")
    .select("user_id, created_at, users:users_with_email(id, name, email, role, active)")
    .eq("account_id", accountId);
  if (error) return err({ message: error.message });
  return ok(data ?? []);
}

export async function insertAccount(data: z.infer<typeof createAccountSchema>) {
  const supabase = createSupabaseServerClient();
  const { data: row, error } = await supabase.from("accounts").insert(data).select().single();
  if (error) return err({ message: error.message });
  return ok(row);
}

export async function patchAccount(data: z.infer<typeof updateAccountSchema>) {
  const supabase = createSupabaseServerClient();
  const { id, ...patch } = data;
  const { data: row, error } = await supabase
    .from("accounts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return err({ message: error.message });
  return ok(row);
}

export async function insertAccountUser(data: z.infer<typeof assignSchema>) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("account_users").insert(data);
  if (error) return err({ message: error.message });
  return ok();
}

export async function deleteAccountUser(data: z.infer<typeof assignSchema>) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("account_users")
    .delete()
    .eq("account_id", data.account_id)
    .eq("user_id", data.user_id);
  if (error) return err({ message: error.message });
  return ok();
}
