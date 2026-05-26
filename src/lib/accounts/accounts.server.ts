import type { z } from "zod";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { assignSchema, createAccountSchema, updateAccountSchema } from "./schema";

const accountSelect =
  "id, name, contact_name, contact_email, contact_phone, active, created_at, updated_at" as const;

export async function fetchAccounts() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(accountSelect)
    .order("name", { ascending: true });
  if (error) return err({ message: error.message });
  return ok(data ?? []);
}

export async function fetchAccount(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(accountSelect)
    .eq("id", id)
    .single();
  if (error) return err({ message: error.message });
  return ok(data);
}

export async function fetchAccountUsers(accountId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("account_users")
    .select("user_id, created_at, users:users(id, name, role, active)")
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
