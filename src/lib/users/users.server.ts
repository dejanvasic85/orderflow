import { ensureSession } from "@/lib/auth/auth.functions";
import { err, ok } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  userPageSize,
  type UpdateUserAccountsInput,
  type User,
  type UserAccount,
  type UserRole,
} from "./schema";

type FetchUsersFilters = {
  q?: string;
  role?: UserRole;
  page?: number;
  excludeIds?: string[];
};

export const userListSelect = `
  id, name, email, phone, active, invite_accepted_at, invited_at, role, notification_preferences, created_at, updated_at,
  account_users!user_id ( account:accounts ( id, name ) )
` as const;

type NotificationPrefs = { email: boolean; sms: boolean };

export function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      email: typeof obj.email === "boolean" ? obj.email : true,
      sms: typeof obj.sms === "boolean" ? obj.sms : false,
    };
  }
  return { email: true, sms: false };
}

export type ListedRow = {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  invite_accepted_at: string | null;
  invited_at: string | null;
  role: User["role"] | null;
  notification_preferences: unknown;
  created_at: string | null;
  updated_at: string | null;
  account_users: { account: UserAccount | null }[] | null;
};

export function mapUser(row: ListedRow): User {
  return {
    id: row.id ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone,
    active: row.active ?? true,
    invite_accepted_at: row.invite_accepted_at ?? null,
    invited_at: row.invited_at ?? null,
    role: row.role ?? "user",
    notificationPreferences: parseNotificationPrefs(row.notification_preferences),
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    accounts: (row.account_users ?? [])
      .map((au) => au.account)
      .filter((a): a is UserAccount => a !== null),
  };
}

export async function assertAdmin(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const sessionUser = await ensureSession();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", sessionUser.id)
    .single();
  if (profileError) {
    console.error("Failed to fetch user profile for admin check:", profileError);
    throw new Error("Unauthorized");
  }
  if (profile.role !== "admin") throw new Error("Forbidden");
}

export async function assertAdminOrStaff(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const sessionUser = await ensureSession();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", sessionUser.id)
    .single();
  if (profileError) {
    console.error("Failed to fetch user profile for role check:", profileError);
    throw new Error("Unauthorized");
  }
  if (profile.role !== "admin" && profile.role !== "staff") throw new Error("Forbidden");
}

export async function resolveAccountNames(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  accountIds: string[],
): Promise<UserAccount[]> {
  const { data, error } = await supabase.from("accounts").select("id, name").in("id", accountIds);
  if (error) {
    console.error("Failed to resolve account names:", error);
    return accountIds.map((id) => ({ id, name: id }));
  }
  return (data ?? []).map((a) => ({ id: a.id, name: a.name }));
}

export async function fetchUsers(filters: FetchUsersFilters = {}) {
  const supabaseServer = createSupabaseServerClient();
  await assertAdminOrStaff(supabaseServer);

  const isSubsetQuery = filters.excludeIds && filters.excludeIds.length > 0;

  let query = supabaseServer
    .from("users_with_email")
    .select(userListSelect, isSubsetQuery ? undefined : { count: "exact" })
    .order("name", { ascending: true });

  if (filters.q) {
    const safe = filters.q.replace(/[%_()]/g, "");
    query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  if (filters.role) {
    query = query.eq("role", filters.role);
  }
  if (isSubsetQuery) {
    query = query.not("id", "in", `(${filters.excludeIds!.join(",")})`);
    const { data, error } = await query;
    if (error) return err({ message: error.message });
    return ok({ users: (data as ListedRow[] | null)?.map(mapUser) ?? [], total: 0 });
  }

  const page = filters.page ?? 1;
  const from = (page - 1) * userPageSize;
  query = query.range(from, from + userPageSize - 1);

  const { data, error, count } = await query;
  if (error) return err({ message: error.message });
  return ok({ users: (data as ListedRow[] | null)?.map(mapUser) ?? [], total: count ?? 0 });
}

export async function fetchUser(id: string) {
  const supabaseServer = createSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("users")
    .select("id, name, phone, active, role, notification_preferences, created_at, updated_at")
    .eq("id", id)
    .single();
  if (error) return err({ message: error.message });
  return ok(data);
}

export async function patchUser(data: {
  id: string;
  accountIds?: string[];
  active?: boolean;
  [key: string]: unknown;
}) {
  const supabaseServer = createSupabaseServerClient();
  const { id, accountIds, notificationPreferences, ...rest } = data as typeof data & {
    notificationPreferences?: { email: boolean; sms: boolean };
  };
  const patch = notificationPreferences
    ? { ...rest, notification_preferences: notificationPreferences }
    : rest;

  if ("active" in patch) {
    await assertAdmin(supabaseServer);
  }

  const { error } = await supabaseServer
    .from("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();
  if (error) return err({ message: error.message });

  if ("active" in patch) {
    const admin = createSupabaseAdminClient();
    const { error: banError } = await admin.auth.admin.updateUserById(id, {
      ban_duration: patch.active ? "none" : "876600h",
    });
    if (banError) {
      console.error("Failed to sync auth ban status, rolling back active flag:", banError);
      await supabaseServer.from("users").update({ active: !patch.active }).eq("id", id);
      return err({ message: "Failed to update user login access" });
    }
  }

  if (accountIds !== undefined) {
    const { error: deleteError } = await supabaseServer
      .from("account_users")
      .delete()
      .eq("user_id", id);
    if (deleteError) return err({ message: deleteError.message });

    if (accountIds.length > 0) {
      const { error: insertError } = await supabaseServer
        .from("account_users")
        .insert(accountIds.map((account_id) => ({ account_id, user_id: id })));
      if (insertError) return err({ message: insertError.message });
    }
  }

  return ok();
}

export async function checkEmail(email: string) {
  const supabaseServer = createSupabaseServerClient();
  await assertAdmin(supabaseServer);
  const { data, error } = await supabaseServer
    .from("users_with_email")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error) return err({ message: error.message });
  return ok(data !== null);
}

export async function sendInvite(data: {
  email: string;
  name: string;
  phone?: string | null;
  role: User["role"];
  notificationPreferences: User["notificationPreferences"];
  accountIds: string[];
  siteUrl: string;
}) {
  const supabaseServer = createSupabaseServerClient();
  await assertAdmin(supabaseServer);

  const admin = createSupabaseAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    data.email,
    {
      data: { name: data.name },
      redirectTo: `${data.siteUrl}/auth/callback`,
    },
  );
  if (inviteError) {
    console.error("Failed to send invite:", inviteError);
    return err({ message: "Unable to send user invitation" });
  }
  const newUserId = invited.user.id;

  const { error: updateError } = await supabaseServer
    .from("users")
    .update({
      name: data.name,
      phone: data.phone ?? null,
      role: data.role,
      notification_preferences: data.notificationPreferences,
    })
    .eq("id", newUserId);

  if (updateError) {
    console.error("Post-invite DB update failed, rolling back auth user:", updateError);
    await admin.auth.admin.deleteUser(newUserId);
    return err({ message: "Unable to complete user invitation" });
  }

  if (data.accountIds.length > 0) {
    const { error: assignError } = await supabaseServer.from("account_users").insert(
      data.accountIds.map((account_id) => ({
        account_id,
        user_id: newUserId,
      })),
    );
    if (assignError) {
      console.error("Post-invite account assignment failed, rolling back auth user:", assignError);
      await admin.auth.admin.deleteUser(newUserId);
      return err({ message: "Unable to complete user invitation" });
    }
  }

  const accounts: UserAccount[] =
    data.accountIds.length > 0 ? await resolveAccountNames(supabaseServer, data.accountIds) : [];

  const now = new Date().toISOString();
  return ok({
    id: newUserId,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    active: true,
    invite_accepted_at: null,
    invited_at: now,
    role: data.role,
    notificationPreferences: data.notificationPreferences,
    created_at: now,
    updated_at: now,
    accounts,
  });
}

export async function patchUserAccounts(data: UpdateUserAccountsInput) {
  const supabase = createSupabaseServerClient();
  await assertAdmin(supabase);

  const [deleteResult, insertResult] = await Promise.all([
    data.toRemove.length > 0
      ? supabase
          .from("account_users")
          .delete()
          .eq("user_id", data.userId)
          .in("account_id", data.toRemove)
      : Promise.resolve(null),
    data.toAdd.length > 0
      ? supabase
          .from("account_users")
          .insert(data.toAdd.map((account_id) => ({ account_id, user_id: data.userId })))
      : Promise.resolve(null),
  ]);

  const firstError = [deleteResult?.error, insertResult?.error].find(Boolean);
  if (firstError) return err({ message: firstError.message });
  return ok();
}

export async function resendUserInvite(id: string, siteUrl: string) {
  const supabaseServer = createSupabaseServerClient();
  await assertAdmin(supabaseServer);

  const { data: user, error } = await supabaseServer
    .from("users_with_email")
    .select("email")
    .eq("id", id)
    .single();
  if (error || !user?.email) return err({ message: "User not found" });

  const admin = createSupabaseAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(user.email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });
  if (inviteError) {
    console.error("Failed to resend invite:", inviteError);
    return err({ message: "Unable to resend invitation" });
  }

  return ok({ invitedAt: new Date().toISOString() });
}
