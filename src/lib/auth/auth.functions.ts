import { createServerFn } from "@tanstack/react-start";
import {
  fetchSession,
  fetchSessionOrThrow,
  verifyOtpToken,
  verifyResetTokenFromOtp,
} from "./auth.server";

export const getSession = createServerFn({ method: "GET" }).handler(fetchSession);

export const ensureSession = createServerFn({ method: "GET" }).handler(fetchSessionOrThrow);

export const verifyResetToken = createServerFn({ method: "GET" })
  .inputValidator((data: { token_hash: string; type: "recovery" }) => data)
  .handler(async ({ data }) => verifyResetTokenFromOtp(data.token_hash));

export const verifyOtp = createServerFn({ method: "GET" })
  .inputValidator((data: { token_hash: string; type: string; next: string }) => data)
  .handler(async ({ data }) => verifyOtpToken(data.token_hash, data.type, data.next));
