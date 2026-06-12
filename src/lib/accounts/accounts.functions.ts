import { createServerFn } from "@tanstack/react-start";
import {
  deleteAccountUser,
  fetchAccount,
  fetchAccountUsers,
  fetchAccounts,
  fetchAccountsForCurrentUser,
  insertAccount,
  insertAccountUser,
  patchAccount,
} from "./accounts.server";
import {
  assignSchema,
  createAccountSchema,
  listAccountsSearchSchema,
  updateAccountSchema,
} from "./schema";

export const listAccounts = createServerFn({ method: "GET", strict: { output: false } })
  .validator(listAccountsSearchSchema)
  .handler(async ({ data }) => fetchAccounts(data));

export const listAccountsForCurrentUser = createServerFn({
  method: "GET",
  strict: { output: false },
}).handler(fetchAccountsForCurrentUser);

export const getAccount = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => fetchAccount(id));

export const listAccountUsers = createServerFn({ method: "GET", strict: { output: false } })
  .validator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => fetchAccountUsers(accountId));

export const createAccount = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createAccountSchema)
  .handler(async ({ data }) => insertAccount(data));

export const updateAccount = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateAccountSchema)
  .handler(async ({ data }) => patchAccount(data));

export const assignUserToAccount = createServerFn({ method: "POST", strict: { output: false } })
  .validator(assignSchema)
  .handler(async ({ data }) => insertAccountUser(data));

export const unassignUserFromAccount = createServerFn({
  method: "POST",
  strict: { output: false },
})
  .validator(assignSchema)
  .handler(async ({ data }) => deleteAccountUser(data));
