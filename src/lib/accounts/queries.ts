import { createServerFn } from "@tanstack/react-start";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { assignSchema, createAccountSchema, updateAccountSchema } from "./schema";

export const listAccounts = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseServer = createSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("accounts")
    .select("id, name, contact_name, contact_email, contact_phone, active, created_at, updated_at")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getAccount = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabaseServer = createSupabaseServerClient();
    const { data, error } = await supabaseServer
      .from("accounts")
      .select(
        "id, name, contact_name, contact_email, contact_phone, active, created_at, updated_at",
      )
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const listAccountUsers = createServerFn({ method: "GET" })
  .inputValidator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => {
    const supabaseServer = createSupabaseServerClient();
    const { data, error } = await supabaseServer
      .from("account_users")
      .select("user_id, created_at, users:users(id, name, role, active)")
      .eq("account_id", accountId);
    if (error) throw new Error(error.message);
    return data;
  });

// Server — admin-only via RLS
export const createAccount = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(createAccountSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { data: row, error } = await supabaseServer
      .from("accounts")
      .insert(data)
      .select()
      .single();
    if (error) return err({ message: error.message });
    return ok(row);
  });

// Server — admin-only via RLS
export const updateAccount = createServerFn({ method: "POST", strict: { output: false } })
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
    if (error) return err({ message: error.message });
    return ok(row);
  });

// Server — admin-only via RLS
export const assignUserToAccount = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(assignSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { error } = await supabaseServer.from("account_users").insert(data);
    if (error) return err({ message: error.message });
    return ok();
  });

// Server — admin-only via RLS
export const unassignUserFromAccount = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(assignSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { error } = await supabaseServer
      .from("account_users")
      .delete()
      .eq("account_id", data.account_id)
      .eq("user_id", data.user_id);
    if (error) return err({ message: error.message });
    return ok();
  });
