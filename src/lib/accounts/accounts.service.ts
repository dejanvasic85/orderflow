import type { Result } from "@/lib/result";
import type { AccountListedRow, AccountRepository, AccountUserRow } from "./accounts.repository";
import type {
  Account,
  AccountRow,
  AssignAccountUserInput,
  CreateAccountInput,
  ListAccountsSearch,
  UpdateAccountInput,
} from "./schema";

export type AccountServiceDeps = {
  repo: AccountRepository;
  session: () => Promise<{ id: string }>;
};

export function mapAccount(row: AccountListedRow): Account {
  return { ...row, userCount: row.account_users?.length ?? 0 };
}

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
  const result = await deps.repo.findPagedAccounts(filters);
  if (!result.ok) return result;
  return {
    ok: true,
    value: { accounts: result.value.accounts.map(mapAccount), total: result.value.total },
  };
}

export async function getAccount(deps: AccountServiceDeps, id: string): Promise<Result<Account>> {
  const result = await deps.repo.findAccountById(id);
  if (!result.ok) return result;
  return { ok: true, value: mapAccount(result.value) };
}

export async function listAccountUsers(
  deps: AccountServiceDeps,
  accountId: string,
): Promise<Result<AccountUserRow[]>> {
  return deps.repo.findAccountUsers(accountId);
}

export async function createAccount(
  deps: AccountServiceDeps,
  data: CreateAccountInput,
): Promise<Result<AccountRow>> {
  return deps.repo.createAccount(data);
}

export async function updateAccount(
  deps: AccountServiceDeps,
  data: UpdateAccountInput,
): Promise<Result<AccountRow>> {
  return deps.repo.updateAccount(data);
}

export async function assignUser(
  deps: AccountServiceDeps,
  data: AssignAccountUserInput,
): Promise<Result<void>> {
  return deps.repo.assignUserToAccount(data);
}

export async function unassignUser(
  deps: AccountServiceDeps,
  data: AssignAccountUserInput,
): Promise<Result<void>> {
  return deps.repo.unassignUserFromAccount(data);
}
