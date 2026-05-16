import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { updateUserSchema, type User, type UserAccount } from "./schema";

const userListSelect = `
  id, name, email, phone, active, role, notification_preferences, created_at, updated_at,
  account_users!user_id ( account:accounts ( id, name ) )
` as const;

type NotificationPrefs = { email: boolean; sms: boolean };

function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      email: typeof obj.email === "boolean" ? obj.email : true,
      sms: typeof obj.sms === "boolean" ? obj.sms : false,
    };
  }
  return { email: true, sms: false };
}

type ListedRow = {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  role: User["role"] | null;
  notification_preferences: unknown;
  created_at: string | null;
  updated_at: string | null;
  account_users: { account: UserAccount | null }[] | null;
};

function mapUser(row: ListedRow): User {
  return {
    id: row.id ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone,
    active: row.active ?? true,
    role: row.role ?? "user",
    notification_preferences: parseNotificationPrefs(row.notification_preferences),
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    accounts: (row.account_users ?? [])
      .map((au) => au.account)
      .filter((a): a is UserAccount => a !== null),
  };
}

// Browser — RLS: admin/staff see all; user sees only self
export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users_with_email")
    .select(userListSelect)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ListedRow[] | null)?.map(mapUser) ?? [];
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
