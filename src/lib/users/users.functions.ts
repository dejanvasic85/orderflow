import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "@/lib/config";
import { createUserSchema, updateUserSchema } from "./schema";
import {
  checkEmail,
  fetchUser,
  fetchUsers,
  patchUser,
  resendUserInvite,
  sendInvite,
} from "./users.server";

export const listUsers = createServerFn({ method: "GET" }).handler(fetchUsers);

export const getUser = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => fetchUser(id));

export const updateUser = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => patchUser(data));

export const checkEmailExists = createServerFn({ method: "GET" })
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
