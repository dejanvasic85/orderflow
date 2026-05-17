import { createServerFn } from "@tanstack/react-start";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createUserSchema, updateUserSchema, type User, type UserAccount } from "./schema";

const userListSelect = `
  id, name, email, phone, active, invite_accepted_at, role, notification_preferences, created_at, updated_at,
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
  invite_accepted_at: string | null;
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
    invite_accepted_at: row.invite_accepted_at ?? null,
    role: row.role ?? "user",
    notification_preferences: parseNotificationPrefs(row.notification_preferences),
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    accounts: (row.account_users ?? [])
      .map((au) => au.account)
      .filter((a): a is UserAccount => a !== null),
  };
}

export const listUsers = createServerFn({ method: "GET" }).handler(async (): Promise<User[]> => {
  const supabaseServer = createSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("users_with_email")
    .select(userListSelect)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ListedRow[] | null)?.map(mapUser) ?? [];
});

export const getUser = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabaseServer = createSupabaseServerClient();
    const { data, error } = await supabaseServer
      .from("users")
      .select("id, name, phone, active, role, notification_preferences, created_at, updated_at")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

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

async function assertAdmin(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError) throw new Error(profileError.message);
  if (profile.role !== "admin") throw new Error("Forbidden");
}

// Server — admin invites a new user. Supabase sends the invite email; the DB trigger
// (handle_new_auth_user) creates the public.users row, which we then patch with role/profile.
export const inviteUser = createServerFn({ method: "POST" })
  .inputValidator(createUserSchema)
  .handler(async ({ data }): Promise<User> => {
    const supabaseServer = createSupabaseServerClient();
    await assertAdmin(supabaseServer);

    const admin = createSupabaseAdminClient();
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      data.email,
      { data: { name: data.name } },
    );
    if (inviteError) throw new Error(inviteError.message);
    const newUserId = invited.user.id;

    const { error: updateError } = await supabaseServer
      .from("users")
      .update({
        name: data.name,
        phone: data.phone ?? null,
        role: data.role,
        notification_preferences: data.notification_preferences,
      })
      .eq("id", newUserId);
    if (updateError) throw new Error(updateError.message);

    if (data.accountIds.length > 0) {
      const { error: assignError } = await supabaseServer.from("account_users").insert(
        data.accountIds.map((account_id) => ({
          account_id,
          user_id: newUserId,
        })),
      );
      if (assignError) throw new Error(assignError.message);
    }

    const { data: row, error: fetchError } = await supabaseServer
      .from("users_with_email")
      .select(userListSelect)
      .eq("id", newUserId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return mapUser(row as ListedRow);
  });
