import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "@/lib/config";
import type { UserRole } from "./schema";
import { createUserSchema, updateUserSchema, updateUserAccountsSchema } from "./schema";
import {
  checkEmail,
  fetchUser,
  fetchUsers,
  patchUser,
  patchUserAccounts,
  resendUserInvite,
  sendInvite,
} from "./users.server";

type ListUsersFilters = {
  role?: UserRole;
  excludeIds?: string[];
};

export const listUsers = createServerFn({ method: "GET", strict: { output: false } })
  .inputValidator((filters: ListUsersFilters = {}) => filters)
  .handler(async ({ data: filters }) => fetchUsers(filters));

export const getUser = createServerFn({ method: "GET", strict: { output: false } })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => fetchUser(id));

export const updateUser = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => patchUser(data));

export const checkEmailExists = createServerFn({ method: "GET", strict: { output: false } })
  .inputValidator((email: string) => email)
  .handler(async ({ data: email }) => checkEmail(email));

export const inviteUser = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    const { SITE_URL } = getServerConfig();
    return sendInvite({ ...data, siteUrl: SITE_URL });
  });

export const resendInvite = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { SITE_URL } = getServerConfig();
    return resendUserInvite(id, SITE_URL);
  });

export const updateUserAccounts = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(updateUserAccountsSchema)
  .handler(async ({ data }) => patchUserAccounts(data));
