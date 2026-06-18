import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerConfig } from "@/lib/config";
import {
  createUserSchema,
  listUsersSearchSchema,
  type ListUsersSearch,
  setUserPasswordSchema,
  updateOwnProfileSchema,
  updateUserSchema,
  updateUserAccountsSchema,
} from "./schema";
import { adminSendPasswordReset, adminSetUserPassword } from "./setUserPassword.server";
import {
  checkEmail,
  fetchOwnProfile,
  fetchUser,
  fetchUsers,
  patchOwnProfile,
  patchUser,
  patchUserAccounts,
  resendUserInvite,
  sendInvite,
} from "./users.server";

export const listUsers = createServerFn({ method: "GET", strict: { output: false } })
  .validator((filters: ListUsersSearch = {}) => listUsersSearchSchema.parse(filters))
  .handler(async ({ data: filters }) => fetchUsers(filters));

export const getUser = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => fetchUser(id));

export const updateUser = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateUserSchema)
  .handler(async ({ data }) => patchUser(data));

export const checkEmailExists = createServerFn({ method: "GET", strict: { output: false } })
  .validator((email: string) => email)
  .handler(async ({ data: email }) => checkEmail(email));

export const inviteUser = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createUserSchema)
  .handler(async ({ data }) => {
    const { SITE_URL } = getServerConfig();
    return sendInvite({ ...data, siteUrl: SITE_URL });
  });

export const resendInvite = createServerFn({ method: "POST", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { SITE_URL } = getServerConfig();
    return resendUserInvite(id, SITE_URL);
  });

export const updateUserAccounts = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateUserAccountsSchema)
  .handler(async ({ data }) => patchUserAccounts(data));

export const setUserPassword = createServerFn({ method: "POST", strict: { output: false } })
  .validator(setUserPasswordSchema)
  .handler(async ({ data }) => adminSetUserPassword(data));

export const sendUserPasswordReset = createServerFn({ method: "POST", strict: { output: false } })
  .validator((userId: string) => z.uuid().parse(userId))
  .handler(async ({ data: userId }) => {
    const { SITE_URL } = getServerConfig();
    return adminSendPasswordReset(userId, SITE_URL);
  });

export const getOwnProfile = createServerFn({ method: "GET", strict: { output: false } }).handler(
  fetchOwnProfile,
);

export const updateOwnProfile = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateOwnProfileSchema)
  .handler(async ({ data }) => patchOwnProfile(data));
