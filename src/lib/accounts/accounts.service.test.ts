import { err, ok } from "@/lib/result";
import type { AccountRepository } from "./accounts.repository";
import {
  assignUser,
  createAccount,
  getAccount,
  listAccounts,
  listAccountsForCurrentUser,
  listAccountUsers,
  mapAccount,
  type AccountServiceDeps,
  unassignUser,
  updateAccount,
} from "./accounts.service";

function makeRepo(overrides: Partial<AccountRepository> = {}): AccountRepository {
  return {
    findAccountsForUser: vi.fn().mockResolvedValue(ok([])),
    findPagedAccounts: vi.fn().mockResolvedValue(ok({ accounts: [], total: 0 })),
    findAccountById: vi
      .fn()
      .mockResolvedValue(ok({ id: "acc-1", name: "Test", account_users: [] })),
    findAccountUsers: vi.fn().mockResolvedValue(ok([])),
    createAccount: vi.fn().mockResolvedValue(ok({ id: "acc-new", name: "New" })),
    updateAccount: vi.fn().mockResolvedValue(ok({ id: "acc-1", name: "Updated" })),
    assignUserToAccount: vi.fn().mockResolvedValue(ok()),
    unassignUserFromAccount: vi.fn().mockResolvedValue(ok()),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<AccountServiceDeps> = {}): AccountServiceDeps {
  return {
    repo: makeRepo(),
    session: vi.fn().mockResolvedValue({ id: "user-1" }),
    ...overrides,
  };
}

describe("mapAccount", () => {
  it("sets userCount to the length of account_users", () => {
    const row = {
      id: "acc-1",
      name: "Boutique",
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      delivery_address: null,
      delivery_instructions: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      account_users: [{ user_id: "u-1" }, { user_id: "u-2" }],
    };

    const result = mapAccount(row);

    expect(result.userCount).toBe(2);
  });

  it("defaults userCount to 0 when account_users is null", () => {
    const row = {
      id: "acc-1",
      name: "Boutique",
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      delivery_address: null,
      delivery_instructions: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      account_users: null,
    };

    const result = mapAccount(row);

    expect(result.userCount).toBe(0);
  });

  it("defaults userCount to 0 when account_users is empty", () => {
    const row = {
      id: "acc-1",
      name: "Boutique",
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      delivery_address: null,
      delivery_instructions: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      account_users: [],
    };

    const result = mapAccount(row);

    expect(result.userCount).toBe(0);
  });
});

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
  it("maps rows through mapAccount", async () => {
    const rawRow = {
      id: "acc-1",
      name: "Boutique",
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      delivery_address: null,
      delivery_instructions: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      account_users: [{ user_id: "u-1" }, { user_id: "u-2" }],
    };
    const findPagedAccounts = vi.fn().mockResolvedValue(ok({ accounts: [rawRow], total: 1 }));
    const deps = makeDeps({ repo: makeRepo({ findPagedAccounts }) });

    const result = await listAccounts(deps, {});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.total).toBe(1);
      expect(result.value.accounts[0].userCount).toBe(2);
    }
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
  it("maps the row through mapAccount", async () => {
    const rawRow = {
      id: "acc-1",
      name: "Boutique",
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      delivery_address: null,
      delivery_instructions: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      account_users: [{ user_id: "u-1" }],
    };
    const findAccountById = vi.fn().mockResolvedValue(ok(rawRow));
    const deps = makeDeps({ repo: makeRepo({ findAccountById }) });

    const result = await getAccount(deps, "acc-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.userCount).toBe(1);
    }
  });

  it("propagates a repo error", async () => {
    const findAccountById = vi.fn().mockResolvedValue(err({ message: "not found" }));
    const deps = makeDeps({ repo: makeRepo({ findAccountById }) });

    const result = await getAccount(deps, "acc-99");

    expect(result).toEqual(err({ message: "not found" }));
  });
});

describe("assignUser", () => {
  it("delegates to repo.assignUserToAccount", async () => {
    const assignUserToAccount = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ assignUserToAccount }) });

    const result = await assignUser(deps, { account_id: "acc-1", user_id: "u-1" });

    expect(result).toEqual(ok());
    expect(assignUserToAccount).toHaveBeenCalledWith({ account_id: "acc-1", user_id: "u-1" });
  });
});

describe("unassignUser", () => {
  it("delegates to repo.unassignUserFromAccount", async () => {
    const unassignUserFromAccount = vi.fn().mockResolvedValue(ok());
    const deps = makeDeps({ repo: makeRepo({ unassignUserFromAccount }) });

    const result = await unassignUser(deps, { account_id: "acc-1", user_id: "u-1" });

    expect(result).toEqual(ok());
    expect(unassignUserFromAccount).toHaveBeenCalledWith({ account_id: "acc-1", user_id: "u-1" });
  });
});

describe("createAccount", () => {
  it("delegates to repo.createAccount", async () => {
    const created = { id: "acc-new", name: "New Wines" } as never;
    const createAccountFn = vi.fn().mockResolvedValue(ok(created));
    const deps = makeDeps({ repo: makeRepo({ createAccount: createAccountFn }) });

    const result = await createAccount(deps, { name: "New Wines" });

    expect(result).toEqual(ok(created));
  });
});

describe("updateAccount", () => {
  it("delegates to repo.updateAccount", async () => {
    const updated = { id: "acc-1", name: "Renamed Wines" } as never;
    const updateAccountFn = vi.fn().mockResolvedValue(ok(updated));
    const deps = makeDeps({ repo: makeRepo({ updateAccount: updateAccountFn }) });

    const result = await updateAccount(deps, { id: "acc-1", name: "Renamed Wines" });

    expect(result).toEqual(ok(updated));
  });
});

describe("listAccountUsers", () => {
  it("delegates to repo.findAccountUsers", async () => {
    const users = [{ user_id: "u-1", created_at: "2024-01-01", users: null }];
    const findAccountUsers = vi.fn().mockResolvedValue(ok(users));
    const deps = makeDeps({ repo: makeRepo({ findAccountUsers }) });

    const result = await listAccountUsers(deps, "acc-1");

    expect(result).toEqual(ok(users));
    expect(findAccountUsers).toHaveBeenCalledWith("acc-1");
  });
});
