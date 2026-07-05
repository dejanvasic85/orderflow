import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "@/lib/log/logger";
import { err, ok, type Result } from "@/lib/result";

const minDelay = () => new Promise((resolve) => setTimeout(resolve, 3000));

type RedirectPath = "/manage/dashboard" | "/auth/set-password";

type VerifyParams = {
  supabase: SupabaseClient;
  code: string | undefined;
  hash: string;
  effectiveType: string | null | undefined;
};

export type VerifyResult = Result<{ path: RedirectPath }, { message: string }>;

export async function verifyCallback({
  supabase,
  code,
  hash,
  effectiveType,
}: VerifyParams): Promise<VerifyResult> {
  const hashParams = new URLSearchParams(hash.slice(1));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") ?? "";

  if (accessToken) {
    const [{ error }] = await Promise.all([
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
      minDelay(),
    ]);
    if (error) {
      log.error("auth.callback", "set session failed", { error: error.message });
      return err({ message: error.message });
    }
    log.info("auth.callback", "auth callback verified", { type: effectiveType });
    return ok({ path: resolveRedirectPath(effectiveType) });
  }

  if (!code) {
    log.warn("auth.callback", "callback request is missing a verification code");
    return err({ message: "Invalid or missing verification code. The link may have expired." });
  }

  const [{ error }] = await Promise.all([supabase.auth.exchangeCodeForSession(code), minDelay()]);
  if (error) {
    log.error("auth.callback", "code exchange failed", { error: error.message });
    return err({ message: error.message });
  }

  log.info("auth.callback", "verified", { type: effectiveType });
  return ok({ path: resolveRedirectPath(effectiveType) });
}

function resolveRedirectPath(type: string | null | undefined): RedirectPath {
  switch (type) {
    case "invite":
      return "/auth/set-password";
    default:
      return "/manage/dashboard";
  }
}
