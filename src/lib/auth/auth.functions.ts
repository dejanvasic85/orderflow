import { createServerFn } from "@tanstack/react-start";
import {
  fetchSession,
  fetchSessionOrThrow,
  verifyOtpToken,
  verifyResetTokenFromOtp,
} from "./auth.server";
import { changePassword as changePasswordDb } from "./changePassword.server";
import { updatePassword } from "./setPassword.server";

export const getSession = createServerFn({ method: "GET" }).handler(fetchSession);

export const ensureSession = createServerFn({ method: "GET" }).handler(fetchSessionOrThrow);

export const verifyResetToken = createServerFn({ method: "GET" })
  .validator((data: { token_hash: string; type: "recovery" }) => data)
  .handler(async ({ data }) => verifyResetTokenFromOtp(data.token_hash));

export const verifyOtp = createServerFn({ method: "GET" })
  .validator((data: { token_hash: string; type: string; next: string }) => data)
  .handler(async ({ data }) => verifyOtpToken(data.token_hash, data.type, data.next));

export const setPassword = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => updatePassword(data.password));

export const changePassword = createServerFn({ method: "POST" })
  .validator((data: { currentPassword: string; newPassword: string }) => data)
  .handler(async ({ data }) => changePasswordDb(data));
