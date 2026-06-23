import { createServerFn } from "@tanstack/react-start";
import { assertAdmin, fetchSessionOrThrow } from "@/lib/auth/auth.server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createAccountRepository } from "./accounts.repository";
import {
  assignUser,
  createAccount as createAccountSvc,
  getAccount as getAccountSvc,
  listAccounts as listAccountsSvc,
  listAccountsForCurrentUser as listAccountsForCurrentUserSvc,
  listAccountUsers as listAccountUsersSvc,
  type AccountServiceDeps,
  unassignUser,
  updateAccount as updateAccountSvc,
} from "./accounts.service";
import {
  assignSchema,
  createAccountSchema,
  listAccountsSearchSchema,
  updateAccountSchema,
} from "./schema";

const deps: AccountServiceDeps = {
  repo: createAccountRepository(),
  session: fetchSessionOrThrow,
  authorize: () => assertAdmin(createSupabaseServerClient()),
};

export const listAccounts = createServerFn({ method: "GET", strict: { output: false } })
  .validator(listAccountsSearchSchema)
  .handler(async ({ data }) => listAccountsSvc(deps, data));

export const listAccountsForCurrentUser = createServerFn({
  method: "GET",
  strict: { output: false },
}).handler(() => listAccountsForCurrentUserSvc(deps));

export const getAccount = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => getAccountSvc(deps, id));

export const listAccountUsers = createServerFn({ method: "GET", strict: { output: false } })
  .validator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => listAccountUsersSvc(deps, accountId));

export const createAccount = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createAccountSchema)
  .handler(async ({ data }) => createAccountSvc(deps, data));

export const updateAccount = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateAccountSchema)
  .handler(async ({ data }) => updateAccountSvc(deps, data));

export const assignUserToAccount = createServerFn({ method: "POST", strict: { output: false } })
  .validator(assignSchema)
  .handler(async ({ data }) => assignUser(deps, data));

export const unassignUserFromAccount = createServerFn({
  method: "POST",
  strict: { output: false },
})
  .validator(assignSchema)
  .handler(async ({ data }) => unassignUser(deps, data));
