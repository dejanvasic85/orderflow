import { err, ok, type Result } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserAccount, UserRole } from "./schema";
import { userPageSize } from "./schema";

export const userListSelect = `
  id, name, email, phone, active, invite_accepted_at, invited_at, role, notification_preferences, created_at, updated_at,
  account_users!user_id ( account:accounts ( id, name ) )
` as const;

export type ListedRow = {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  invite_accepted_at: string | null;
  invited_at: string | null;
  role: UserRole | null;
  notification_preferences: unknown;
  created_at: string | null;
  updated_at: string | null;
  account_users: { account: UserAccount | null }[] | null;
};

export type RawUserRow = {
  id: string;
  name: string | null;
  phone: string | null;
  active: boolean | null;
  role: string | null;
  notification_preferences: unknown;
  created_at: string | null;
  updated_at: string | null;
};

export type OwnProfileData = {
  name: string | null;
  phone: string | null;
  notification_preferences: unknown;
};

export type UserFieldPatch = {
  name?: string;
  phone?: string | null;
  active?: boolean;
  role?: UserRole;
  notification_preferences?: { email: boolean; sms: boolean };
};

export type InviteUserFields = {
  name: string;
  phone: string | null;
  role: UserRole;
  notification_preferences: { email: boolean; sms: boolean };
};

export type FindUsersFilters = {
  q?: string;
  role?: UserRole;
  page?: number;
  excludeIds?: string[];
};

export type UserRepository = {
  findPagedUsers(filters: FindUsersFilters): Promise<Result<{ users: ListedRow[]; total: number }>>;
  findUserById(id: string): Promise<Result<RawUserRow>>;

  findOwnProfile(userId: string): Promise<Result<OwnProfileData>>;
  updateOwnProfile(
    userId: string,
    patch: {
      name: string;
      phone: string | null;
      notification_preferences: { email: boolean; sms: boolean };
    },
  ): Promise<Result<void>>;

  updateUser(id: string, patch: UserFieldPatch): Promise<Result<void>>;
  syncAuthBanStatus(userId: string, active: boolean): Promise<Result<void>>;

  replaceUserAccounts(userId: string, accountIds: string[]): Promise<Result<void>>;
  addUserToAccounts(userId: string, accountIds: string[]): Promise<Result<void>>;
  removeUserFromAccounts(userId: string, accountIds: string[]): Promise<Result<void>>;

  findUserEmail(userId: string): Promise<Result<string | null>>;
  findUserName(userId: string): Promise<Result<string | null>>;
  findEmailExists(email: string): Promise<Result<boolean>>;

  inviteUserByEmail(
    email: string,
    options: { name: string; redirectTo: string },
  ): Promise<Result<{ userId: string }>>;
  updateInvitedUserFields(userId: string, fields: InviteUserFields): Promise<Result<void>>;
  deleteAuthUser(userId: string): Promise<Result<void>>;
  resendInvite(email: string, redirectTo: string): Promise<Result<void>>;
  setPassword(userId: string, password: string): Promise<Result<void>>;

  findAccountNames(accountIds: string[]): Promise<Result<UserAccount[]>>;
};

export function createUserRepository(): UserRepository {
  return {
    async findPagedUsers(filters) {
      const supabase = createSupabaseServerClient();
      const isSubsetQuery = filters.excludeIds && filters.excludeIds.length > 0;

      let query = supabase
        .from("users_with_email")
        .select(userListSelect, isSubsetQuery ? undefined : { count: "exact" })
        .order("name", { ascending: true });

      if (filters.q) {
        const safe = filters.q.replace(/[,%_()]/g, "").trim();
        if (safe.length > 0) {
          query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
        }
      }
      if (filters.role) {
        query = query.eq("role", filters.role);
      }
      if (isSubsetQuery) {
        query = query.not("id", "in", `(${filters.excludeIds!.join(",")})`);
        const { data, error } = await query;
        if (error) return err({ message: error.message });
        return ok({ users: (data as ListedRow[] | null) ?? [], total: 0 });
      }

      const page = filters.page ?? 1;
      const from = (page - 1) * userPageSize;
      query = query.range(from, from + userPageSize - 1);

      const { data, error, count } = await query;
      if (error) return err({ message: error.message });
      return ok({ users: (data as ListedRow[] | null) ?? [], total: count ?? 0 });
    },

    async findUserById(id) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("users")
        .select("id, name, phone, active, role, notification_preferences, created_at, updated_at")
        .eq("id", id)
        .single();
      if (error) return err({ message: error.message });
      return ok(data as RawUserRow);
    },

    async findOwnProfile(userId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("users")
        .select("name, phone, notification_preferences")
        .eq("id", userId)
        .single();
      if (error) return err({ message: error.message });
      return ok(data);
    },

    async updateOwnProfile(userId, patch) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.from("users").update(patch).eq("id", userId);
      if (error) return err({ message: error.message });
      return ok();
    },

    async updateUser(id, patch) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.from("users").update(patch).eq("id", id).select().single();
      if (error) return err({ message: error.message });
      return ok();
    },

    async syncAuthBanStatus(userId, active) {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: active ? "none" : "876600h",
      });
      if (error) return err({ message: error.message });
      return ok();
    },

    async replaceUserAccounts(userId, accountIds) {
      const supabase = createSupabaseServerClient();
      const { error: deleteError } = await supabase
        .from("account_users")
        .delete()
        .eq("user_id", userId);
      if (deleteError) return err({ message: deleteError.message });

      if (accountIds.length > 0) {
        const { error: insertError } = await supabase
          .from("account_users")
          .insert(accountIds.map((account_id) => ({ account_id, user_id: userId })));
        if (insertError) return err({ message: insertError.message });
      }
      return ok();
    },

    async addUserToAccounts(userId, accountIds) {
      if (accountIds.length === 0) return ok();
      const supabase = createSupabaseServerClient();
      const { error } = await supabase
        .from("account_users")
        .insert(accountIds.map((account_id) => ({ account_id, user_id: userId })));
      if (error) return err({ message: error.message });
      return ok();
    },

    async removeUserFromAccounts(userId, accountIds) {
      if (accountIds.length === 0) return ok();
      const supabase = createSupabaseServerClient();
      const { error } = await supabase
        .from("account_users")
        .delete()
        .eq("user_id", userId)
        .in("account_id", accountIds);
      if (error) return err({ message: error.message });
      return ok();
    },

    async findUserEmail(userId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("users_with_email")
        .select("email")
        .eq("id", userId)
        .single();
      if (error) return err({ message: error.message });
      return ok(data?.email ?? null);
    },

    async findUserName(userId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from("users").select("name").eq("id", userId).single();
      if (error) return err({ message: error.message });
      return ok(data?.name ?? null);
    },

    async findEmailExists(email) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("users_with_email")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (error) return err({ message: error.message });
      return ok(data !== null);
    },

    async inviteUserByEmail(email, options) {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { name: options.name },
        redirectTo: `${options.redirectTo}/auth/callback`,
      });
      if (error) {
        console.error("Failed to send invite:", error);
        return err({ message: "Unable to send user invitation" });
      }
      return ok({ userId: data.user.id });
    },

    async updateInvitedUserFields(userId, fields) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase
        .from("users")
        .update({
          name: fields.name,
          phone: fields.phone,
          role: fields.role,
          notification_preferences: fields.notification_preferences,
        })
        .eq("id", userId);
      if (error) return err({ message: error.message });
      return ok();
    },

    async deleteAuthUser(userId) {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return err({ message: error.message });
      return ok();
    },

    async resendInvite(email, redirectTo) {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${redirectTo}/auth/callback`,
      });
      if (error) {
        console.error("Failed to resend invite:", error);
        return err({ message: "Unable to resend invitation" });
      }
      return ok();
    },

    async setPassword(userId, password) {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { must_change_password: true },
      });
      if (error) return err({ message: error.message });
      return ok();
    },

    async findAccountNames(accountIds) {
      if (accountIds.length === 0) return ok([]);
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .in("id", accountIds);
      if (error) return err({ message: error.message });
      return ok((data ?? []).map((a) => ({ id: a.id, name: a.name })));
    },
  };
}
