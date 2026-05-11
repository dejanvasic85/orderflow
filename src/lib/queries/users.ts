import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type UserRow = {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  role: "admin" | "staff" | "user";
  notification_preferences: { email: boolean; sms: boolean };
  created_at: string;
  updated_at: string;
};

const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  active: z.boolean().optional(),
  role: z.enum(["admin", "staff", "user"]).optional(),
  notification_preferences: z.object({ email: z.boolean(), sms: z.boolean() }).optional(),
});

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
