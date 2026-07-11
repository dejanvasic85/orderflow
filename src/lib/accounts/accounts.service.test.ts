import { err, ok } from "@/lib/result";
import { makeAccount, makeAccountUser } from "@/test/fixtures/accountFixtures";
import type { AccountRepository } from "./accounts.repository";
import {
  assignUser,
  createAccount,
  getAccount,
  listAccounts,
  listAccountsForCurrentUser,
  listAccountUsers,
  type AccountServiceDeps,
  unassignUser,
  updateAccount,
} from "./accounts.service";
import type { Account } from "./schema";

const baseAccount = makeAccount({
  name: "Boutique",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  userCount: 2,
});

function makeRepo(overrides: Partial<AccountRepository> = {}): AccountRepository {
  return {
    findAccountsForUser: vi.fn().mockResolvedValue(ok([])),
    findPagedAccounts: vi.fn().mockResolvedValue(ok({ accounts: [], total: 0 })),
    findAccountById: vi.fn().mockResolvedValue(ok(baseAccount)),
    findAccountUsers: vi.fn().mockResolvedValue(ok([])),
    createAccount: vi.fn().mockResolvedValue(ok({ id: "acc-new", name: "New" } as Account)),
    updateAccount: vi.fn().mockResolvedValue(ok({ id: "acc-1", name: "Updated" } as Account)),
    assignUserToAccount: vi.fn().mockResolvedValue(ok()),
    unassignUserFromAccount: vi.fn().mockResolvedValue(ok()),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<AccountServiceDeps> = {}): AccountServiceDeps {
  return {
    repo: makeRepo(),
    session: vi.fn().mockResolvedValue({ id: "user-1" }),
    authorize: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("listAccountsForCurrentUser", () => {
  it("resolves the user id from session and passes it to repo", async () => {
    const session = vi.fn().mockResolvedValue({ id: "user-42" });
    const findAccountsForUser = vi.fn().mockResolvedValue(ok([{ id: "acc-1", name: "Wines Co" }]));
    const deps = makeDeps({ repo: makeRepo({ findAccountsForUser }), session });

    const result = await listAccountsForCurrentUser(deps);

    expect(result).toEqual(ok([{ id: "acc-1", name: "Wines Co" }]));
    expect(findAccountsForUser).toHaveBeenCalledWith("user-42");
  });

  it("propagates a repo error", async () => {
    const findAccountsForUser = vi.fn().mockResolvedValue(err({ message: "db error" }));
    const deps = makeDeps({ repo: makeRepo({ findAccountsForUser }) });

    const result = await listAccountsForCurrentUser(deps);

    expect(result).toEqual(err({ message: "db error" }));
  });
});

describe("listAccounts", () => {
  it("returns accounts from the repo", async () => {
    const findPagedAccounts = vi.fn().mockResolvedValue(ok({ accounts: [baseAccount], total: 1 }));
    const deps = makeDeps({ repo: makeRepo({ findPagedAccounts }) });

    const result = await listAccounts(deps, {});

    expect(result).toEqual(ok({ accounts: [baseAccount], total: 1 }));
  });

  it("passes filters through to repo", async () => {
    const findPagedAccounts = vi.fn().mockResolvedValue(ok({ accounts: [], total: 0 }));
    const deps = makeDeps({ repo: makeRepo({ findPagedAccounts }) });

    await listAccounts(deps, { q: "wine", page: 2 });

    expect(findPagedAccounts).toHaveBeenCalledWith({ q: "wine", page: 2 });
  });

  it("propagates a repo error", async () => {
    const findPagedAccounts = vi.fn().mockResolvedValue(err({ message: "db error" }));
    const deps = makeDeps({ repo: makeRepo({ findPagedAccounts }) });

    const result = await listAccounts(deps, {});

    expect(result).toEqual(err({ message: "db error" }));
  });
});

describe("getAccount", () => {
  it("returns the account from the repo", async () => {
    const findAccountById = vi.fn().mockResolvedValue(ok(baseAccount));
    const deps = makeDeps({ repo: makeRepo({ findAccountById }) });

    const result = await getAccount(deps, "acc-1");

    expect(result).toEqual(ok(baseAccount));
  });

  it("propagates a repo error", async () => {
    const findAccountById = vi.fn().mockResolvedValue(err({ message: "not found" }));
    const deps = makeDeps({ repo: makeRepo({ findAccountById }) });

    const result = await getAccount(deps, "acc-99");

    expect(result).toEqual(err({ message: "not found" }));
  });
});

describe("assignUser", () => {
  it("calls authorize then delegates to repo.assignUserToAccount", async () => {
    const assignUserToAccount = vi.fn().mockResolvedValue(ok());
    const authorize = vi.fn().mockResolvedValue(undefined);
    const deps = makeDeps({ repo: makeRepo({ assignUserToAccount }), authorize });

    const result = await assignUser(deps, { accountId: "acc-1", userId: "u-1" });

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(result).toEqual(ok());
    expect(assignUserToAccount).toHaveBeenCalledWith({ accountId: "acc-1", userId: "u-1" });
  });

  it("throws without calling repo when authorize rejects", async () => {
    const assignUserToAccount = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ assignUserToAccount }),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(assignUser(deps, { accountId: "acc-1", userId: "u-1" })).rejects.toThrow(
      "Forbidden",
    );
    expect(assignUserToAccount).not.toHaveBeenCalled();
  });
});

describe("unassignUser", () => {
  it("calls authorize then delegates to repo.unassignUserFromAccount", async () => {
    const unassignUserFromAccount = vi.fn().mockResolvedValue(ok());
    const authorize = vi.fn().mockResolvedValue(undefined);
    const deps = makeDeps({ repo: makeRepo({ unassignUserFromAccount }), authorize });

    const result = await unassignUser(deps, { accountId: "acc-1", userId: "u-1" });

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(result).toEqual(ok());
    expect(unassignUserFromAccount).toHaveBeenCalledWith({ accountId: "acc-1", userId: "u-1" });
  });

  it("throws without calling repo when authorize rejects", async () => {
    const unassignUserFromAccount = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ unassignUserFromAccount }),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(unassignUser(deps, { accountId: "acc-1", userId: "u-1" })).rejects.toThrow(
      "Forbidden",
    );
    expect(unassignUserFromAccount).not.toHaveBeenCalled();
  });
});

describe("createAccount", () => {
  it("calls authorize then delegates to repo.createAccount", async () => {
    const created = { id: "acc-new", name: "New Wines" } as Account;
    const createAccountFn = vi.fn().mockResolvedValue(ok(created));
    const authorize = vi.fn().mockResolvedValue(undefined);
    const deps = makeDeps({ repo: makeRepo({ createAccount: createAccountFn }), authorize });

    const result = await createAccount(deps, { name: "New Wines" });

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(result).toEqual(ok(created));
  });

  it("throws without calling repo when authorize rejects", async () => {
    const createAccountFn = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ createAccount: createAccountFn }),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(createAccount(deps, { name: "New Wines" })).rejects.toThrow("Forbidden");
    expect(createAccountFn).not.toHaveBeenCalled();
  });
});

describe("updateAccount", () => {
  it("calls authorize then delegates to repo.updateAccount", async () => {
    const updated = { id: "acc-1", name: "Renamed Wines" } as Account;
    const updateAccountFn = vi.fn().mockResolvedValue(ok(updated));
    const authorize = vi.fn().mockResolvedValue(undefined);
    const deps = makeDeps({ repo: makeRepo({ updateAccount: updateAccountFn }), authorize });

    const result = await updateAccount(deps, { id: "acc-1", name: "Renamed Wines" });

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(result).toEqual(ok(updated));
  });

  it("throws without calling repo when authorize rejects", async () => {
    const updateAccountFn = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ updateAccount: updateAccountFn }),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(updateAccount(deps, { id: "acc-1", name: "Renamed Wines" })).rejects.toThrow(
      "Forbidden",
    );
    expect(updateAccountFn).not.toHaveBeenCalled();
  });
});

describe("listAccountUsers", () => {
  it("delegates to repo.findAccountUsers", async () => {
    const users = [makeAccountUser({ createdAt: "2024-01-01", user: null })];
    const findAccountUsers = vi.fn().mockResolvedValue(ok(users));
    const deps = makeDeps({ repo: makeRepo({ findAccountUsers }) });

    const result = await listAccountUsers(deps, "acc-1");

    expect(result).toEqual(ok(users));
    expect(findAccountUsers).toHaveBeenCalledWith("acc-1");
  });
});
