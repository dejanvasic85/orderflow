import { createServerFn } from "@tanstack/react-start";
import { ensureSession } from "@/lib/authFunctions";
import { getServerConfig } from "@/lib/config";
import { err, ok } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createUserSchema, updateUserSchema, type User, type UserAccount } from "./schema";

const userListSelect = `
  id, name, email, phone, active, invite_accepted_at, invited_at, role, notification_preferences, created_at, updated_at,
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
  invited_at: string | null;
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
    invited_at: row.invited_at ?? null,
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
export const updateUser = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    const { id, accountIds, ...patch } = data;

    if ("active" in patch) {
      await assertAdmin(supabaseServer);
    }

    const { data: row, error } = await supabaseServer
      .from("users")
      .update(patch)
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

    return ok(row as unknown as User);
  });

async function assertAdmin(supabase: ReturnType<typeof createSupabaseServerClient>) {
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

// Server — admin invites a new user. Supabase sends the invite email; the DB trigger
// (handle_new_auth_user) creates the public.users row, which we then patch with role/profile.
export const checkEmailExists = createServerFn({ method: "GET" })
  .inputValidator((email: string) => email)
  .handler(async ({ data: email }): Promise<boolean> => {
    const supabaseServer = createSupabaseServerClient();
    await assertAdmin(supabaseServer);
    const { data, error } = await supabaseServer
      .from("users_with_email")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data !== null;
  });

export const inviteUser = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    const supabaseServer = createSupabaseServerClient();
    await assertAdmin(supabaseServer);

    const admin = createSupabaseAdminClient();
    const { SITE_URL } = getServerConfig();
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      data.email,
      {
        data: { name: data.name },
        redirectTo: `${SITE_URL}/auth/callback`,
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
        notification_preferences: data.notification_preferences,
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
        console.error(
          "Post-invite account assignment failed, rolling back auth user:",
          assignError,
        );
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
      notification_preferences: data.notification_preferences,
      created_at: now,
      updated_at: now,
      accounts,
    });
  });

export const resendInvite = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabaseServer = createSupabaseServerClient();
    await assertAdmin(supabaseServer);

    const { data: user, error } = await supabaseServer
      .from("users_with_email")
      .select("email")
      .eq("id", id)
      .single();
    if (error || !user?.email) return err({ message: "User not found" });

    const admin = createSupabaseAdminClient();
    const { SITE_URL } = getServerConfig();
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(user.email, {
      redirectTo: `${SITE_URL}/auth/callback`,
    });
    if (inviteError) {
      console.error("Failed to resend invite:", inviteError);
      return err({ message: "Unable to resend invitation" });
    }

    return ok({ invitedAt: new Date().toISOString() });
  });

async function resolveAccountNames(
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
