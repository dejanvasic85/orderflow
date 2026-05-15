import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { assignSchema, createAccountSchema, updateAccountSchema } from "./schema";

// Browser — RLS: admin/staff see all; user sees assigned accounts only
export async function listAccounts() {
  return supabase
    .from("accounts")
    .select("id, name, contact_name, contact_email, contact_phone, active, created_at, updated_at")
    .order("name", { ascending: true });
}

// Browser
export async function getAccount(id: string) {
  return supabase
    .from("accounts")
    .select("id, name, contact_name, contact_email, contact_phone, active, created_at, updated_at")
    .eq("id", id)
    .single();
}

// Browser — joins users via FK; admin/staff only by RLS on account_users + users
export async function listAccountUsers(accountId: string) {
  return supabase
    .from("account_users")
    .select("user_id, created_at, users:users(id, name, role, active)")
    .eq("account_id", accountId);
}

// Server — admin-only via RLS
export const createAccount = createServerFn({ method: "POST" })
  .inputValidator(createAccountSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { data: row, error } = await supabaseServer
      .from("accounts")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// Server — admin-only via RLS
export const updateAccount = createServerFn({ method: "POST" })
  .inputValidator(updateAccountSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { id, ...patch } = data;
    const { data: row, error } = await supabaseServer
      .from("accounts")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// Server — admin-only via RLS
export const assignUserToAccount = createServerFn({ method: "POST" })
  .inputValidator(assignSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { error } = await supabaseServer.from("account_users").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Server — admin-only via RLS
export const unassignUserFromAccount = createServerFn({ method: "POST" })
  .inputValidator(assignSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { error } = await supabaseServer
      .from("account_users")
      .delete()
      .eq("account_id", data.account_id)
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
