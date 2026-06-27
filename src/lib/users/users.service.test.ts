import { err, ok } from "@/lib/result";
import type { UserRepository } from "./users.repository";
import {
  checkEmailExists,
  getOwnProfile,
  getUser,
  inviteUser,
  listUsers,
  mapUser,
  resendUserInvite,
  sendUserPasswordReset,
  setUserPassword,
  type UserServiceDeps,
  updateOwnProfile,
  updateUser,
  updateUserAccounts,
} from "./users.service";

const baseListedRow = {
  id: "u-1",
  name: "Jane Smith",
  email: "jane@example.com",
  phone: "0412345678",
  active: true,
  invite_accepted_at: null,
  invited_at: null,
  role: "user" as const,
  notification_preferences: { email: true, sms: false },
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  account_users: [{ account: { id: "acc-1", name: "Wines Co" } }],
};

function makeRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findPagedUsers: vi.fn().mockResolvedValue(ok({ users: [], total: 0 })),
    findUserById: vi.fn().mockResolvedValue(ok({ id: "u-1", name: "Jane", role: "user" })),
    findOwnProfile: vi
      .fn()
      .mockResolvedValue(ok({ name: "Jane", phone: "0412", notification_preferences: null })),
    updateOwnProfile: vi.fn().mockResolvedValue(ok()),
    updateUser: vi.fn().mockResolvedValue(ok()),
    syncAuthBanStatus: vi.fn().mockResolvedValue(ok()),
    replaceUserAccounts: vi.fn().mockResolvedValue(ok()),
    addUserToAccounts: vi.fn().mockResolvedValue(ok()),
    removeUserFromAccounts: vi.fn().mockResolvedValue(ok()),
    findUserEmail: vi.fn().mockResolvedValue(ok("jane@example.com")),
    findUserName: vi.fn().mockResolvedValue(ok("Admin User")),
    findEmailExists: vi.fn().mockResolvedValue(ok(false)),
    inviteUserByEmail: vi.fn().mockResolvedValue(ok({ userId: "u-new" })),
    updateInvitedUserFields: vi.fn().mockResolvedValue(ok()),
    deleteAuthUser: vi.fn().mockResolvedValue(ok()),
    resendInvite: vi.fn().mockResolvedValue(ok()),
    setPassword: vi.fn().mockResolvedValue(ok()),
    findAccountNames: vi.fn().mockResolvedValue(ok([])),
    ...overrides,
  };
}

const fakeLog = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

function makeDeps(overrides: Partial<UserServiceDeps> = {}): UserServiceDeps {
  return {
    repo: makeRepo(),
    session: vi.fn().mockResolvedValue({ id: "session-user", email: "admin@example.com" }),
    authorize: vi.fn().mockResolvedValue(undefined),
    authorizeStaff: vi.fn().mockResolvedValue(undefined),
    log: fakeLog,
    notify: {
      passwordSet: vi.fn().mockResolvedValue(undefined),
      passwordReset: vi.fn().mockResolvedValue({ success: true }),
    },
    ...overrides,
  };
}

describe("mapUser", () => {
  it("maps all fields with defaults for null values", () => {
    const result = mapUser({
      id: "u-1",
      name: "Jane",
      email: "jane@example.com",
      phone: null,
      active: null,
      invite_accepted_at: null,
      invited_at: null,
      role: null,
      notification_preferences: null,
      created_at: null,
      updated_at: null,
      account_users: null,
    });

    expect(result.id).toBe("u-1");
    expect(result.name).toBe("Jane");
    expect(result.active).toBe(true);
    expect(result.role).toBe("user");
    expect(result.accounts).toEqual([]);
    expect(result.notificationPreferences).toEqual({ email: true, sms: false });
  });

  it("assembles accounts from account_users join, filtering out nulls", () => {
    const result = mapUser({
      ...baseListedRow,
      account_users: [
        { account: { id: "acc-1", name: "Wines Co" } },
        { account: null },
        { account: { id: "acc-2", name: "Beer Co" } },
      ],
    });

    expect(result.accounts).toEqual([
      { id: "acc-1", name: "Wines Co" },
      { id: "acc-2", name: "Beer Co" },
    ]);
  });

  it("parses notificationPreferences from raw preference object", () => {
    const result = mapUser({
      ...baseListedRow,
      notification_preferences: { email: false, sms: true },
    });

    expect(result.notificationPreferences).toEqual({ email: false, sms: true });
  });
});

describe("listUsers", () => {
  it("calls authorizeStaff before querying repo", async () => {
    const authorizeStaff = vi.fn().mockResolvedValue(undefined);
    const findPagedUsers = vi.fn().mockResolvedValue(ok({ users: [], total: 0 }));
    const deps = makeDeps({ repo: makeRepo({ findPagedUsers }), authorizeStaff });

    await listUsers(deps, {});

    expect(authorizeStaff).toHaveBeenCalledTimes(1);
    expect(findPagedUsers).toHaveBeenCalledTimes(1);
  });

  it("throws without calling repo when authorizeStaff rejects", async () => {
    const findPagedUsers = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ findPagedUsers }),
      authorizeStaff: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(listUsers(deps, {})).rejects.toThrow("Forbidden");
    expect(findPagedUsers).not.toHaveBeenCalled();
  });

  it("maps ListedRow array through mapUser", async () => {
    const findPagedUsers = vi.fn().mockResolvedValue(ok({ users: [baseListedRow], total: 1 }));
    const deps = makeDeps({ repo: makeRepo({ findPagedUsers }) });

    const result = await listUsers(deps, {});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.total).toBe(1);
      expect(result.value.users[0].email).toBe("jane@example.com");
      expect(result.value.users[0].accounts).toEqual([{ id: "acc-1", name: "Wines Co" }]);
    }
  });

  it("propagates a repo error", async () => {
    const findPagedUsers = vi.fn().mockResolvedValue(err({ message: "db error" }));
    const deps = makeDeps({ repo: makeRepo({ findPagedUsers }) });

    const result = await listUsers(deps, {});

    expect(result).toEqual(err({ message: "db error" }));
  });
});

describe("getUser", () => {
  it("calls authorizeStaff before fetching user", async () => {
    const authorizeStaff = vi.fn().mockResolvedValue(undefined);
    const findUserById = vi.fn().mockResolvedValue(ok({ id: "u-42" }));
    const deps = makeDeps({ repo: makeRepo({ findUserById }), authorizeStaff });

    await getUser(deps, "u-42");

    expect(authorizeStaff).toHaveBeenCalledTimes(1);
    expect(findUserById).toHaveBeenCalledTimes(1);
  });

  it("throws without calling repo when authorizeStaff rejects", async () => {
    const findUserById = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ findUserById }),
      authorizeStaff: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(getUser(deps, "u-42")).rejects.toThrow("Forbidden");
    expect(findUserById).not.toHaveBeenCalled();
  });

  it("delegates to repo.findUserById with the correct id", async () => {
    const rawUser = { id: "u-42", name: "Bob", role: "user" };
    const findUserById = vi.fn().mockResolvedValue(ok(rawUser));
    const deps = makeDeps({ repo: makeRepo({ findUserById }) });

    const result = await getUser(deps, "u-42");

    expect(result).toEqual(ok(rawUser));
    expect(findUserById).toHaveBeenCalledWith("u-42");
  });
});

describe("getOwnProfile", () => {
  it("calls session to resolve userId then fetches profile", async () => {
    const session = vi.fn().mockResolvedValue({ id: "current-user", email: "me@example.com" });
    const findOwnProfile = vi.fn().mockResolvedValue(
      ok({
        name: "Me",
        phone: "0499999999",
        notification_preferences: { email: true, sms: false },
      }),
    );
    const deps = makeDeps({ repo: makeRepo({ findOwnProfile }), session });

    const result = await getOwnProfile(deps);

    expect(findOwnProfile).toHaveBeenCalledWith("current-user");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("me@example.com");
      expect(result.value.name).toBe("Me");
      expect(result.value.notificationPreferences).toEqual({ email: true, sms: false });
    }
  });

  it("propagates a repo error", async () => {
    const findOwnProfile = vi.fn().mockResolvedValue(err({ message: "not found" }));
    const deps = makeDeps({ repo: makeRepo({ findOwnProfile }) });

    const result = await getOwnProfile(deps);

    expect(result).toEqual(err({ message: "not found" }));
  });
});

describe("updateOwnProfile", () => {
  it("calls session to get userId and passes the correct patch", async () => {
    const session = vi.fn().mockResolvedValue({ id: "me", email: "me@example.com" });
    const updateOwnProfileFn = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ updateOwnProfile: updateOwnProfileFn }), session });
    const input = {
      name: "New Name",
      phone: "0412345678",
      notificationPreferences: { email: false, sms: true },
    };

    await updateOwnProfile(deps, input);

    expect(updateOwnProfileFn).toHaveBeenCalledWith("me", {
      name: "New Name",
      phone: "0412345678",
      notification_preferences: { email: false, sms: true },
    });
  });

  it("uses null when phone is undefined", async () => {
    const updateOwnProfileFn = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ updateOwnProfile: updateOwnProfileFn }) });

    await updateOwnProfile(deps, {
      name: "Name",
      phone: undefined,
      notificationPreferences: { email: true, sms: false },
    });

    expect(updateOwnProfileFn).toHaveBeenCalledWith("session-user", {
      name: "Name",
      phone: null,
      notification_preferences: { email: true, sms: false },
    });
  });
});

describe("updateUser — active flag path", () => {
  it("calls authorize for all update paths", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const updateUserFn = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ updateUser: updateUserFn }), authorize });

    await updateUser(deps, { id: "u-1", name: "New Name" });

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(updateUserFn).toHaveBeenCalledTimes(1);
  });

  it("calls syncAuthBanStatus after updateUser when active changes", async () => {
    const syncAuthBanStatus = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ syncAuthBanStatus }) });

    await updateUser(deps, { id: "u-1", active: false });

    expect(syncAuthBanStatus).toHaveBeenCalledWith("u-1", false);
  });

  it("rolls back the active flag when syncAuthBanStatus fails", async () => {
    const updateUserFn = vi.fn().mockResolvedValue(ok());
    const syncAuthBanStatus = vi.fn().mockResolvedValue(err({ message: "ban failed" }));
    const deps = makeDeps({ repo: makeRepo({ updateUser: updateUserFn, syncAuthBanStatus }) });

    const result = await updateUser(deps, { id: "u-1", active: false });

    expect(result).toEqual(err({ message: "Failed to update user login access" }));
    expect(updateUserFn).toHaveBeenCalledTimes(2);
    expect(updateUserFn).toHaveBeenLastCalledWith("u-1", { active: true });
    expect(fakeLog.error).toHaveBeenCalledWith("user.ban", "sync failed, rolled back active flag", {
      userId: "u-1",
      error: "ban failed",
    });
  });

  it("does not call syncAuthBanStatus when active is not in the update", async () => {
    const syncAuthBanStatus = vi.fn();
    const deps = makeDeps({ repo: makeRepo({ syncAuthBanStatus }) });

    await updateUser(deps, { id: "u-1", name: "New Name" });

    expect(syncAuthBanStatus).not.toHaveBeenCalled();
  });
});

describe("updateUser — accountIds path", () => {
  it("calls replaceUserAccounts when accountIds is provided", async () => {
    const replaceUserAccounts = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ replaceUserAccounts }) });

    await updateUser(deps, { id: "u-1", accountIds: ["acc-1", "acc-2"] });

    expect(replaceUserAccounts).toHaveBeenCalledWith("u-1", ["acc-1", "acc-2"]);
  });

  it("does not call replaceUserAccounts when accountIds is absent", async () => {
    const replaceUserAccounts = vi.fn();
    const deps = makeDeps({ repo: makeRepo({ replaceUserAccounts }) });

    await updateUser(deps, { id: "u-1", name: "New Name" });

    expect(replaceUserAccounts).not.toHaveBeenCalled();
  });
});

describe("checkEmailExists", () => {
  it("calls authorize then delegates to repo.findEmailExists", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const findEmailExists = vi.fn().mockResolvedValue(ok(true));
    const deps = makeDeps({ repo: makeRepo({ findEmailExists }), authorize });

    const result = await checkEmailExists(deps, "test@example.com");

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(result).toEqual(ok(true));
    expect(findEmailExists).toHaveBeenCalledWith("test@example.com");
  });

  it("throws without calling repo when authorize rejects", async () => {
    const findEmailExists = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ findEmailExists }),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(checkEmailExists(deps, "test@example.com")).rejects.toThrow("Forbidden");
    expect(findEmailExists).not.toHaveBeenCalled();
  });
});

describe("inviteUser", () => {
  const inviteData = {
    email: "new@example.com",
    name: "New User",
    phone: null,
    role: "user" as const,
    notificationPreferences: { email: true, sms: false },
    accountIds: ["acc-1"],
    siteUrl: "https://app.example.com",
  };

  it("calls authorize before any repo operations", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const inviteUserByEmail = vi.fn().mockResolvedValue(ok({ userId: "u-new" }));
    const findAccountNames = vi.fn().mockResolvedValue(ok([{ id: "acc-1", name: "Wines" }]));
    const deps = makeDeps({ repo: makeRepo({ inviteUserByEmail, findAccountNames }), authorize });

    await inviteUser(deps, inviteData);

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(authorize.mock.invocationCallOrder[0]).toBeLessThan(
      inviteUserByEmail.mock.invocationCallOrder[0],
    );
  });

  it("calls deleteAuthUser when post-invite DB update fails (rollback)", async () => {
    const deleteAuthUser = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({
      repo: makeRepo({
        updateInvitedUserFields: vi.fn().mockResolvedValue(err({ message: "db error" })),
        deleteAuthUser,
      }),
    });

    const result = await inviteUser(deps, inviteData);

    expect(result).toEqual(err({ message: "Unable to complete user invitation" }));
    expect(deleteAuthUser).toHaveBeenCalledWith("u-new");
    expect(fakeLog.error).toHaveBeenCalledWith(
      "invite",
      "db update failed, rolled back auth user",
      { error: "db error" },
    );
  });

  it("calls deleteAuthUser when account assignment fails (rollback)", async () => {
    const deleteAuthUser = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({
      repo: makeRepo({
        addUserToAccounts: vi.fn().mockResolvedValue(err({ message: "assign error" })),
        deleteAuthUser,
      }),
    });

    const result = await inviteUser(deps, inviteData);

    expect(result).toEqual(err({ message: "Unable to complete user invitation" }));
    expect(deleteAuthUser).toHaveBeenCalledWith("u-new");
    expect(fakeLog.error).toHaveBeenCalledWith(
      "invite",
      "account assignment failed, rolled back auth user",
      { error: "assign error" },
    );
  });

  it("returns an assembled User object on success", async () => {
    const findAccountNames = vi.fn().mockResolvedValue(ok([{ id: "acc-1", name: "Wines Co" }]));
    const deps = makeDeps({ repo: makeRepo({ findAccountNames }) });

    const result = await inviteUser(deps, inviteData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("new@example.com");
      expect(result.value.name).toBe("New User");
      expect(result.value.role).toBe("user");
      expect(result.value.accounts).toEqual([{ id: "acc-1", name: "Wines Co" }]);
      expect(result.value.active).toBe(true);
    }
  });

  it("propagates a repo error from findAccountNames", async () => {
    const findAccountNames = vi.fn().mockResolvedValue(err({ message: "accounts lookup failed" }));
    const deps = makeDeps({ repo: makeRepo({ findAccountNames }) });

    const result = await inviteUser(deps, inviteData);

    expect(result).toEqual(err({ message: "accounts lookup failed" }));
  });
});

describe("resendUserInvite", () => {
  it("calls authorize then fetches email then re-invites", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const findUserEmail = vi.fn().mockResolvedValue(ok("jane@example.com"));
    const resendInvite = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ findUserEmail, resendInvite }), authorize });

    const result = await resendUserInvite(deps, "u-1", "https://app.example.com");

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(findUserEmail).toHaveBeenCalledWith("u-1");
    expect(resendInvite).toHaveBeenCalledWith("jane@example.com", "https://app.example.com");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.invitedAt).toBeDefined();
    }
  });

  it("returns an error when user email is null", async () => {
    const findUserEmail = vi.fn().mockResolvedValue(ok(null));
    const deps = makeDeps({ repo: makeRepo({ findUserEmail }) });

    const result = await resendUserInvite(deps, "u-1", "https://app.example.com");

    expect(result).toEqual(err({ message: "User not found" }));
  });
});

describe("updateUserAccounts", () => {
  it("calls authorize before updating accounts", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const deps = makeDeps({ authorize });

    await updateUserAccounts(deps, { userId: "u-1", toAdd: ["acc-2"], toRemove: ["acc-1"] });

    expect(authorize).toHaveBeenCalledTimes(1);
  });

  it("runs remove and add in parallel", async () => {
    const removeUserFromAccounts = vi.fn().mockResolvedValue(ok());
    const addUserToAccounts = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ removeUserFromAccounts, addUserToAccounts }) });

    await updateUserAccounts(deps, { userId: "u-1", toAdd: ["acc-2"], toRemove: ["acc-1"] });

    expect(removeUserFromAccounts).toHaveBeenCalledWith("u-1", ["acc-1"]);
    expect(addUserToAccounts).toHaveBeenCalledWith("u-1", ["acc-2"]);
  });

  it("propagates an error from remove operation", async () => {
    const removeUserFromAccounts = vi.fn().mockResolvedValue(err({ message: "delete failed" }));
    const deps = makeDeps({ repo: makeRepo({ removeUserFromAccounts }) });

    const result = await updateUserAccounts(deps, {
      userId: "u-1",
      toAdd: [],
      toRemove: ["acc-1"],
    });

    expect(result).toEqual(err({ message: "delete failed" }));
  });
});

describe("setUserPassword", () => {
  it("calls authorize before proceeding", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const deps = makeDeps({ authorize, session: vi.fn().mockResolvedValue({ id: "admin-1" }) });

    await setUserPassword(deps, { userId: "u-target", password: "NewPass1!" });

    expect(authorize).toHaveBeenCalledTimes(1);
  });

  it("returns an error when userId equals session user id", async () => {
    const deps = makeDeps({ session: vi.fn().mockResolvedValue({ id: "same-user" }) });

    const result = await setUserPassword(deps, { userId: "same-user", password: "NewPass1!" });

    expect(result).toEqual(err({ message: "Use account settings to change your own password" }));
  });

  it("returns an error when target user email is not found", async () => {
    const deps = makeDeps({
      session: vi.fn().mockResolvedValue({ id: "admin-1" }),
      repo: makeRepo({ findUserEmail: vi.fn().mockResolvedValue(ok(null)) }),
    });

    const result = await setUserPassword(deps, { userId: "u-target", password: "NewPass1!" });

    expect(result).toEqual(err({ message: "Target user not found" }));
  });

  it("calls notify.passwordSet and logs after successfully setting the password", async () => {
    const passwordSet = vi.fn().mockResolvedValue(undefined);
    const deps = makeDeps({
      session: vi.fn().mockResolvedValue({ id: "admin-1" }),
      repo: makeRepo({
        findUserEmail: vi.fn().mockResolvedValue(ok("target@example.com")),
        findUserName: vi.fn().mockResolvedValue(ok("Admin Joe")),
      }),
      notify: { passwordSet, passwordReset: vi.fn() },
    });

    await setUserPassword(deps, { userId: "u-target", password: "NewPass1!" });

    expect(passwordSet).toHaveBeenCalledWith({
      email: "target@example.com",
      adminName: "Admin Joe",
    });
    expect(fakeLog.info).toHaveBeenCalledWith("admin.password", "set for user", {
      userId: "u-target",
      actorId: "admin-1",
    });
  });

  it("propagates a repo error from setPassword without notifying", async () => {
    const passwordSet = vi.fn();
    const deps = makeDeps({
      session: vi.fn().mockResolvedValue({ id: "admin-1" }),
      repo: makeRepo({ setPassword: vi.fn().mockResolvedValue(err({ message: "auth error" })) }),
      notify: { passwordSet, passwordReset: vi.fn() },
    });

    const result = await setUserPassword(deps, { userId: "u-target", password: "NewPass1!" });

    expect(result).toEqual(err({ message: "auth error" }));
    expect(passwordSet).not.toHaveBeenCalled();
  });
});

describe("sendUserPasswordReset", () => {
  it("calls authorize then fetches email then calls notify.passwordReset", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const passwordReset = vi.fn().mockResolvedValue({ success: true });
    const findUserEmail = vi.fn().mockResolvedValue(ok("user@example.com"));
    const deps = makeDeps({
      repo: makeRepo({ findUserEmail }),
      authorize,
      notify: { passwordSet: vi.fn(), passwordReset },
    });

    const result = await sendUserPasswordReset(deps, "u-1", "https://app.example.com");

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(findUserEmail).toHaveBeenCalledWith("u-1");
    expect(passwordReset).toHaveBeenCalledWith("user@example.com", "https://app.example.com");
    expect(result).toEqual(ok());
  });

  it("returns an error when user is not found", async () => {
    const deps = makeDeps({
      repo: makeRepo({ findUserEmail: vi.fn().mockResolvedValue(ok(null)) }),
    });

    const result = await sendUserPasswordReset(deps, "u-99", "https://app.example.com");

    expect(result).toEqual(err({ message: "User not found" }));
  });

  it("returns an error when passwordReset notify fails", async () => {
    const deps = makeDeps({
      notify: {
        passwordSet: vi.fn(),
        passwordReset: vi
          .fn()
          .mockResolvedValue({ success: false, message: "email provider down" }),
      },
    });

    const result = await sendUserPasswordReset(deps, "u-1", "https://app.example.com");

    expect(result).toEqual(err({ message: "email provider down" }));
  });
});
