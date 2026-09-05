import type { Logger } from "@/lib/log/logger";
import { combine, err, mapResult, ok, unwrapOr, type Result } from "@/lib/result";
import { parseNotificationPrefs } from "./notificationPrefs";
import type {
  CreateUserInput,
  CreateUserWithPasswordInput,
  DeleteUserInput,
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
    inviteAcceptedAt: row.invite_accepted_at ?? null,
    invitedAt: row.invited_at ?? null,
    passwordSetAt: row.password_set_at ?? null,
    role: row.role ?? "user",
    notificationPreferences: parseNotificationPrefs(row.notification_preferences),
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
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
  return mapResult(result, ({ users, total }) => ({ users: users.map(mapUser), total }));
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
  return mapResult(result, (profile) => ({
    email: sessionUser.email ?? "",
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    notificationPreferences: parseNotificationPrefs(profile.notification_preferences),
  }));
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

/**
 * Soft delete. The row survives because order_requests.placed_by is
 * `on delete restrict` and history has to stay attributable. Access is revoked
 * by the same GoTrue ban the `active` flag already uses.
 */
export async function deleteUser(
  deps: UserServiceDeps,
  data: DeleteUserInput,
): Promise<Result<void>> {
  await deps.authorize();

  const sessionUser = await deps.session();
  if (data.id === sessionUser.id) {
    return err({ message: "You cannot delete your own account" });
  }

  const userResult = await deps.repo.findUserById(data.id);
  if (!userResult.ok) return userResult;
  const wasActive = userResult.value.active ?? true;

  if (userResult.value.role === "admin") {
    const othersResult = await deps.repo.countOtherActiveAdmins(data.id);
    if (!othersResult.ok) return othersResult;
    if (othersResult.value === 0) {
      return err({ message: "Make someone else an admin before deleting the last one" });
    }
  }

  const deleteResult = await deps.repo.softDeleteUser(data.id);
  if (!deleteResult.ok) return deleteResult;

  const banResult = await deps.repo.syncAuthBanStatus(data.id, false);
  if (!banResult.ok) {
    deps.log.error("user.delete", "ban sync failed, rolled back the delete", {
      userId: data.id,
      error: banResult.error.message,
    });
    await deps.repo.restoreUser(data.id, wasActive);
    return err({ message: "Failed to revoke the user's access" });
  }

  deps.log.info("user.delete", "user deleted", { userId: data.id, actorId: sessionUser.id });
  return ok();
}

export async function checkEmailExists(
  deps: UserServiceDeps,
  email: string,
): Promise<Result<boolean>> {
  await deps.authorize();
  return deps.repo.findEmailExists(email);
}

/** How a failed step after auth-user creation is logged and surfaced. */
type NewUserFailure = { logEvent: string; message: string };

async function rollbackNewUser(
  deps: UserServiceDeps,
  userId: string,
  failure: NewUserFailure,
  reason: string,
  error: string,
): Promise<Result<never>> {
  deps.log.error(failure.logEvent, reason, { error });
  await deps.repo.deleteAuthUser(userId);
  return err({ message: failure.message });
}

/**
 * Applies profile fields and account membership to a freshly created auth user,
 * deleting that auth user again if either step fails. Shared by both creation
 * paths: invite by email, and admin-set password.
 */
async function finaliseNewUser(
  deps: UserServiceDeps,
  userId: string,
  data: CreateUserInput,
  failure: NewUserFailure,
): Promise<Result<UserAccount[]>> {
  const updateResult = await deps.repo.updateNewUserFields(userId, {
    name: data.name,
    phone: data.phone ?? null,
    role: data.role,
    notification_preferences: data.notificationPreferences,
  });
  if (!updateResult.ok) {
    return rollbackNewUser(
      deps,
      userId,
      failure,
      "db update failed, rolled back auth user",
      updateResult.error.message,
    );
  }

  if (data.accountIds.length === 0) return ok([]);

  const assignResult = await deps.repo.addUserToAccounts(userId, data.accountIds);
  if (!assignResult.ok) {
    return rollbackNewUser(
      deps,
      userId,
      failure,
      "account assignment failed, rolled back auth user",
      assignResult.error.message,
    );
  }

  // Enrichment only, and it runs after the account is already usable. Failing the
  // whole call here would report failure for a user who exists, and the retry would
  // then be rejected for a duplicate email.
  const namesResult = await deps.repo.findAccountNames(data.accountIds);
  if (!namesResult.ok) {
    deps.log.error(failure.logEvent, "account name lookup failed, user was still created", {
      userId,
      error: namesResult.error.message,
    });
    return ok([]);
  }

  return namesResult;
}

type NewUserTimestamps = Pick<User, "invitedAt" | "inviteAcceptedAt" | "passwordSetAt">;

/** `restored` tells the caller this address belonged to a deleted account we brought back. */
export type InvitedUser = { user: User; restored: boolean };

function buildNewUser(
  id: string,
  data: CreateUserInput,
  accounts: UserAccount[],
  timestamps: NewUserTimestamps,
): User {
  const now = new Date().toISOString();
  return {
    id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    active: true,
    role: data.role,
    notificationPreferences: data.notificationPreferences,
    createdAt: now,
    updatedAt: now,
    accounts,
    ...timestamps,
  };
}

/**
 * Turns an invite to a deleted user's address back into a restore of the
 * original account, so their order history stays attached. The auth user was
 * never removed, so a fresh invite to that email would collide anyway.
 */
async function restoreDeletedUser(
  deps: UserServiceDeps,
  userId: string,
  data: CreateUserInput,
): Promise<Result<InvitedUser>> {
  const restoreResult = await deps.repo.restoreUser(userId, true);
  if (!restoreResult.ok) return restoreResult;

  const banResult = await deps.repo.syncAuthBanStatus(userId, true);
  if (!banResult.ok) {
    deps.log.error("user.restore", "unban failed, rolled back the restore", {
      userId,
      error: banResult.error.message,
    });
    await deps.repo.softDeleteUser(userId);
    return err({ message: "Failed to restore the user's access" });
  }

  const updateResult = await deps.repo.updateNewUserFields(userId, {
    name: data.name,
    phone: data.phone ?? null,
    role: data.role,
    notification_preferences: data.notificationPreferences,
  });
  if (!updateResult.ok) return updateResult;

  const accountsResult = await deps.repo.replaceUserAccounts(userId, data.accountIds);
  if (!accountsResult.ok) return accountsResult;

  const namesResult = await deps.repo.findAccountNames(data.accountIds);
  const accounts = unwrapOr(namesResult, []) ?? [];

  deps.log.info("user.restore", "restored a deleted user instead of inviting", { userId });

  return ok({
    user: buildNewUser(userId, data, accounts, {
      invitedAt: null,
      inviteAcceptedAt: null,
      passwordSetAt: null,
    }),
    restored: true,
  });
}

export async function inviteUser(
  deps: UserServiceDeps,
  data: CreateUserInput & { siteUrl: string },
): Promise<Result<InvitedUser>> {
  await deps.authorize();

  const deletedResult = await deps.repo.findDeletedUserIdByEmail(data.email);
  if (!deletedResult.ok) return deletedResult;
  if (deletedResult.value) {
    return restoreDeletedUser(deps, deletedResult.value, data);
  }

  const inviteResult = await deps.repo.inviteUserByEmail(data.email, {
    name: data.name,
    redirectTo: data.siteUrl,
  });
  if (!inviteResult.ok) return inviteResult;
  const newUserId = inviteResult.value.userId;

  const accountsResult = await finaliseNewUser(deps, newUserId, data, {
    logEvent: "invite",
    message: "Unable to complete user invitation",
  });
  if (!accountsResult.ok) return accountsResult;

  return ok({
    user: buildNewUser(newUserId, data, accountsResult.value, {
      invitedAt: new Date().toISOString(),
      inviteAcceptedAt: null,
      passwordSetAt: null,
    }),
    restored: false,
  });
}

/**
 * Creates a user who can sign in straight away with a password the admin hands
 * over out of band. No email is sent, so nothing here can expire or be consumed
 * by an email scanner. This is the fallback when invite links fail.
 */
export async function createUserWithPassword(
  deps: UserServiceDeps,
  data: CreateUserWithPasswordInput,
): Promise<Result<User>> {
  await deps.authorize();

  const createResult = await deps.repo.createUserWithPassword(data.email, data.password, {
    name: data.name,
  });
  if (!createResult.ok) return createResult;
  const newUserId = createResult.value.userId;

  const failure = { logEvent: "user.create", message: "Unable to complete user creation" };

  const accountsResult = await finaliseNewUser(deps, newUserId, data, failure);
  if (!accountsResult.ok) return accountsResult;

  // password_set_at only drives the "Pending" badge, so a failure here must not
  // undo a working account.
  const markResult = await deps.repo.markPasswordSet(newUserId);
  if (!markResult.ok) {
    deps.log.error("user.create", "failed to mark password_set_at", {
      userId: newUserId,
      error: markResult.error.message,
    });
  }

  const now = new Date().toISOString();
  deps.log.info("user.create", "user created with a password", { userId: newUserId });

  return ok(
    buildNewUser(newUserId, data, accountsResult.value, {
      invitedAt: null,
      inviteAcceptedAt: now,
      passwordSetAt: now,
    }),
  );
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

  const results = await Promise.all([
    deps.repo.removeUserFromAccounts(data.userId, data.toRemove),
    deps.repo.addUserToAccounts(data.userId, data.toAdd),
  ]);

  return mapResult(combine(results), () => undefined);
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

  const adminName = unwrapOr(nameResult, "An administrator") ?? "An administrator";
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
