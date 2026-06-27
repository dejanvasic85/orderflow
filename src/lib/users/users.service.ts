import type { Logger } from "@/lib/log/logger";
import { err, ok, type Result } from "@/lib/result";
import { parseNotificationPrefs } from "./notificationPrefs";
import type {
  CreateUserInput,
  UpdateOwnProfileInput,
  UpdateUserAccountsInput,
  UpdateUserInput,
  User,
  UserAccount,
} from "./schema";
import type { ListedRow, RawUserRow, UserRepository } from "./users.repository";

type SessionUser = { id: string; email?: string };

export type UserServiceDeps = {
  repo: UserRepository;
  session: () => Promise<SessionUser>;
  authorize: () => Promise<void>;
  authorizeStaff: () => Promise<void>;
  log: Logger;
  notify: {
    passwordSet: (input: { email: string; adminName: string }) => Promise<void>;
    passwordReset: (
      email: string,
      siteUrl: string,
    ) => Promise<{ success: boolean; message?: string }>;
  };
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

export async function listUsers(
  deps: UserServiceDeps,
  filters: Parameters<UserRepository["findPagedUsers"]>[0],
): Promise<Result<{ users: User[]; total: number }>> {
  await deps.authorizeStaff();
  const result = await deps.repo.findPagedUsers(filters);
  if (!result.ok) return result;
  return ok({ users: result.value.users.map(mapUser), total: result.value.total });
}

export async function getUser(deps: UserServiceDeps, id: string): Promise<Result<RawUserRow>> {
  await deps.authorizeStaff();
  return deps.repo.findUserById(id);
}

export async function getOwnProfile(deps: UserServiceDeps): Promise<
  Result<{
    email: string;
    name: string;
    phone: string;
    notificationPreferences: { email: boolean; sms: boolean };
  }>
> {
  const sessionUser = await deps.session();
  const result = await deps.repo.findOwnProfile(sessionUser.id);
  if (!result.ok) return result;
  return ok({
    email: sessionUser.email ?? "",
    name: result.value.name ?? "",
    phone: result.value.phone ?? "",
    notificationPreferences: parseNotificationPrefs(result.value.notification_preferences),
  });
}

export async function updateOwnProfile(
  deps: UserServiceDeps,
  input: UpdateOwnProfileInput,
): Promise<Result<void>> {
  const sessionUser = await deps.session();
  return deps.repo.updateOwnProfile(sessionUser.id, {
    name: input.name,
    phone: input.phone ?? null,
    notification_preferences: input.notificationPreferences,
  });
}

export async function updateUser(
  deps: UserServiceDeps,
  data: UpdateUserInput,
): Promise<Result<void>> {
  await deps.authorize();

  const { id, accountIds, notificationPreferences, active, ...rest } = data;

  const patch = notificationPreferences
    ? { ...rest, active, notification_preferences: notificationPreferences }
    : { ...rest, active };

  const updateResult = await deps.repo.updateUser(id, patch);
  if (!updateResult.ok) return updateResult;

  if (active !== undefined) {
    const banResult = await deps.repo.syncAuthBanStatus(id, active);
    if (!banResult.ok) {
      deps.log.error("user.ban", "sync failed, rolled back active flag", {
        userId: id,
        error: banResult.error.message,
      });
      await deps.repo.updateUser(id, { active: !active });
      return err({ message: "Failed to update user login access" });
    }
  }

  if (accountIds !== undefined) {
    return deps.repo.replaceUserAccounts(id, accountIds);
  }

  return ok();
}

export async function checkEmailExists(
  deps: UserServiceDeps,
  email: string,
): Promise<Result<boolean>> {
  await deps.authorize();
  return deps.repo.findEmailExists(email);
}

export async function inviteUser(
  deps: UserServiceDeps,
  data: CreateUserInput & { siteUrl: string },
): Promise<Result<User>> {
  await deps.authorize();

  const inviteResult = await deps.repo.inviteUserByEmail(data.email, {
    name: data.name,
    redirectTo: data.siteUrl,
  });
  if (!inviteResult.ok) return inviteResult;
  const newUserId = inviteResult.value.userId;

  const updateResult = await deps.repo.updateInvitedUserFields(newUserId, {
    name: data.name,
    phone: data.phone ?? null,
    role: data.role,
    notification_preferences: data.notificationPreferences,
  });
  if (!updateResult.ok) {
    deps.log.error("invite", "db update failed, rolled back auth user", {
      error: updateResult.error.message,
    });
    await deps.repo.deleteAuthUser(newUserId);
    return err({ message: "Unable to complete user invitation" });
  }

  if (data.accountIds.length > 0) {
    const assignResult = await deps.repo.addUserToAccounts(newUserId, data.accountIds);
    if (!assignResult.ok) {
      deps.log.error("invite", "account assignment failed, rolled back auth user", {
        error: assignResult.error.message,
      });
      await deps.repo.deleteAuthUser(newUserId);
      return err({ message: "Unable to complete user invitation" });
    }
  }

  let accounts: UserAccount[] = [];
  if (data.accountIds.length > 0) {
    const accountsResult = await deps.repo.findAccountNames(data.accountIds);
    if (!accountsResult.ok) return accountsResult;
    accounts = accountsResult.value;
  }

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

export async function resendUserInvite(
  deps: UserServiceDeps,
  id: string,
  siteUrl: string,
): Promise<Result<{ invitedAt: string }>> {
  await deps.authorize();

  const emailResult = await deps.repo.findUserEmail(id);
  if (!emailResult.ok) return emailResult;
  if (!emailResult.value) return err({ message: "User not found" });

  const resendResult = await deps.repo.resendInvite(emailResult.value, siteUrl);
  if (!resendResult.ok) return resendResult;

  return ok({ invitedAt: new Date().toISOString() });
}

export async function updateUserAccounts(
  deps: UserServiceDeps,
  data: UpdateUserAccountsInput,
): Promise<Result<void>> {
  await deps.authorize();

  const [removeResult, addResult] = await Promise.all([
    deps.repo.removeUserFromAccounts(data.userId, data.toRemove),
    deps.repo.addUserToAccounts(data.userId, data.toAdd),
  ]);

  const firstError = [removeResult, addResult].find((r) => !r.ok);
  if (firstError && !firstError.ok) return firstError;
  return ok();
}

export async function setUserPassword(
  deps: UserServiceDeps,
  data: { userId: string; password: string },
): Promise<Result<void>> {
  await deps.authorize();

  const sessionUser = await deps.session();
  if (data.userId === sessionUser.id) {
    return err({ message: "Use account settings to change your own password" });
  }

  const [emailResult, nameResult] = await Promise.all([
    deps.repo.findUserEmail(data.userId),
    deps.repo.findUserName(sessionUser.id),
  ]);

  if (!emailResult.ok || !emailResult.value) {
    return err({ message: "Target user not found" });
  }

  const passwordResult = await deps.repo.setPassword(data.userId, data.password);
  if (!passwordResult.ok) return passwordResult;

  const adminName = nameResult.ok ? (nameResult.value ?? "An administrator") : "An administrator";
  deps.log.info("admin.password", "set for user", { userId: data.userId, actorId: sessionUser.id });
  await deps.notify.passwordSet({ email: emailResult.value, adminName });

  return ok();
}

export async function sendUserPasswordReset(
  deps: UserServiceDeps,
  userId: string,
  siteUrl: string,
): Promise<Result<void>> {
  await deps.authorize();

  const emailResult = await deps.repo.findUserEmail(userId);
  if (!emailResult.ok) return emailResult;
  if (!emailResult.value) return err({ message: "User not found" });

  const result = await deps.notify.passwordReset(emailResult.value, siteUrl);
  return result.success ? ok() : err({ message: result.message ?? "Failed to send reset email" });
}
