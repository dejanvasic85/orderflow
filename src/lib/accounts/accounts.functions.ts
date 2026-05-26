import { createServerFn } from "@tanstack/react-start";
import {
  deleteAccountUser,
  fetchAccount,
  fetchAccountUsers,
  fetchAccounts,
  insertAccount,
  insertAccountUser,
  patchAccount,
} from "./accounts.server";
import { assignSchema, createAccountSchema, updateAccountSchema } from "./schema";

export const listAccounts = createServerFn({ method: "GET" }).handler(fetchAccounts);

export const getAccount = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => fetchAccount(id));

export const listAccountUsers = createServerFn({ method: "GET" })
  .inputValidator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => fetchAccountUsers(accountId));

export const createAccount = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(createAccountSchema)
  .handler(async ({ data }) => insertAccount(data));

export const updateAccount = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(updateAccountSchema)
  .handler(async ({ data }) => patchAccount(data));

export const assignUserToAccount = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(assignSchema)
  .handler(async ({ data }) => insertAccountUser(data));

export const unassignUserFromAccount = createServerFn({
  method: "POST",
  strict: { output: false },
})
  .inputValidator(assignSchema)
  .handler(async ({ data }) => deleteAccountUser(data));
