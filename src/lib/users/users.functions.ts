import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  assertAdmin,
  assertAdminOrStaff,
  fetchSessionOrThrow,
  sendPasswordReset,
} from "@/lib/auth/auth.server";
import { getServerConfig } from "@/lib/config";
import { log } from "@/lib/log/logger";
import { notifyAdminPasswordSet } from "@/lib/notifications/notifications.server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  createUserSchema,
  listUsersSearchSchema,
  type ListUsersSearch,
  setUserPasswordSchema,
  updateOwnProfileSchema,
  updateUserAccountsSchema,
  updateUserSchema,
} from "./schema";
import { createUserRepository } from "./users.repository";
import {
  checkEmailExists as checkEmailExistsSvc,
  getOwnProfile as getOwnProfileSvc,
  getUser as getUserSvc,
  inviteUser as inviteUserSvc,
  listUsers as listUsersSvc,
  resendUserInvite as resendUserInviteSvc,
  sendUserPasswordReset as sendUserPasswordResetSvc,
  setUserPassword as setUserPasswordSvc,
  type UserServiceDeps,
  updateOwnProfile as updateOwnProfileSvc,
  updateUser as updateUserSvc,
  updateUserAccounts as updateUserAccountsSvc,
} from "./users.service";

const deps: UserServiceDeps = {
  repo: createUserRepository(),
  session: fetchSessionOrThrow,
  authorize: () => assertAdmin(createSupabaseServerClient()),
  authorizeStaff: () => assertAdminOrStaff(createSupabaseServerClient()),
  log,
  notify: {
    passwordSet: notifyAdminPasswordSet,
    passwordReset: sendPasswordReset,
  },
};

export const listUsers = createServerFn({ method: "GET", strict: { output: false } })
  .validator((filters: ListUsersSearch = {}) => listUsersSearchSchema.parse(filters))
  .handler(async ({ data: filters }) => listUsersSvc(deps, filters));

export const getUser = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: id }) => getUserSvc(deps, id));

export const updateUser = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateUserSchema)
  .handler(async ({ data }) => updateUserSvc(deps, data));

export const checkEmailExists = createServerFn({ method: "GET", strict: { output: false } })
  .validator((email: string) => z.string().email().parse(email))
  .handler(async ({ data: email }) => checkEmailExistsSvc(deps, email));

export const inviteUser = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createUserSchema)
  .handler(async ({ data }) => {
    const { SITE_URL } = getServerConfig();
    return inviteUserSvc(deps, { ...data, siteUrl: SITE_URL });
  });

export const resendInvite = createServerFn({ method: "POST", strict: { output: false } })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: id }) => {
    const { SITE_URL } = getServerConfig();
    return resendUserInviteSvc(deps, id, SITE_URL);
  });

export const updateUserAccounts = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateUserAccountsSchema)
  .handler(async ({ data }) => updateUserAccountsSvc(deps, data));

export const setUserPassword = createServerFn({ method: "POST", strict: { output: false } })
  .validator(setUserPasswordSchema)
  .handler(async ({ data }) => setUserPasswordSvc(deps, data));

export const sendUserPasswordReset = createServerFn({ method: "POST", strict: { output: false } })
  .validator((userId: string) => z.string().uuid().parse(userId))
  .handler(async ({ data: userId }) => {
    const { SITE_URL } = getServerConfig();
    return sendUserPasswordResetSvc(deps, userId, SITE_URL);
  });

export const getOwnProfile = createServerFn({ method: "GET", strict: { output: false } }).handler(
  () => getOwnProfileSvc(deps),
);

export const updateOwnProfile = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateOwnProfileSchema)
  .handler(async ({ data }) => updateOwnProfileSvc(deps, data));
