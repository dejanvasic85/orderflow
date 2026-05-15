import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { updateUserSchema } from "./schema";

// Browser — RLS: admin/staff see all; user sees only self
export async function listUsers() {
  return supabase
    .from("users")
    .select("id, name, phone, active, role, notification_preferences, created_at, updated_at")
    .order("name", { ascending: true });
}

// Browser — RLS: self, or admin/staff
export async function getUser(id: string) {
  return supabase
    .from("users")
    .select("id, name, phone, active, role, notification_preferences, created_at, updated_at")
    .eq("id", id)
    .single();
}

// Server — RLS enforces admin-only role changes; regular users blocked from escalation by DB policy
export const updateUser = createServerFn({ method: "POST" })
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { id, ...patch } = data;
    const { data: row, error } = await supabaseServer
      .from("users")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
