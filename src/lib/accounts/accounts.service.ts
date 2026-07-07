import type { Result } from "@/lib/result";
import type { AccountRepository } from "./accounts.repository";
import type {
  Account,
  AccountUser,
  AssignAccountUserInput,
  CreateAccountInput,
  ListAccountsSearch,
  UpdateAccountInput,
} from "./schema";

export type AccountServiceDeps = {
  repo: AccountRepository;
  session: () => Promise<{ id: string }>;
  authorize: () => Promise<void>;
};

export async function listAccountsForCurrentUser(
  deps: AccountServiceDeps,
): Promise<Result<{ id: string; name: string }[]>> {
  const session = await deps.session();
  return deps.repo.findAccountsForUser(session.id);
}

export async function listAccounts(
  deps: AccountServiceDeps,
  filters: ListAccountsSearch,
): Promise<Result<{ accounts: Account[]; total: number }>> {
  return deps.repo.findPagedAccounts(filters);
}

export async function getAccount(deps: AccountServiceDeps, id: string): Promise<Result<Account>> {
  return deps.repo.findAccountById(id);
}

export async function listAccountUsers(
  deps: AccountServiceDeps,
  accountId: string,
): Promise<Result<AccountUser[]>> {
  return deps.repo.findAccountUsers(accountId);
}

export async function createAccount(
  deps: AccountServiceDeps,
  data: CreateAccountInput,
): Promise<Result<Account>> {
  await deps.authorize();
  return deps.repo.createAccount(data);
}

export async function updateAccount(
  deps: AccountServiceDeps,
  data: UpdateAccountInput,
): Promise<Result<Account>> {
  await deps.authorize();
  return deps.repo.updateAccount(data);
}

export async function assignUser(
  deps: AccountServiceDeps,
  data: AssignAccountUserInput,
): Promise<Result<void>> {
  await deps.authorize();
  return deps.repo.assignUserToAccount(data);
}

export async function unassignUser(
  deps: AccountServiceDeps,
  data: AssignAccountUserInput,
): Promise<Result<void>> {
  await deps.authorize();
  return deps.repo.unassignUserFromAccount(data);
}
