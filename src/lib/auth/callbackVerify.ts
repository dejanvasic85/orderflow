import type { SupabaseClient } from "@supabase/supabase-js";

const minDelay = () => new Promise((resolve) => setTimeout(resolve, 3000));

type RedirectPath = "/dashboard" | "/auth/set-password";

type VerifyParams = {
  supabase: SupabaseClient;
  code: string | undefined;
  hash: string;
  effectiveType: string | null | undefined;
};

export type VerifyResult = { status: "error" } | { status: "navigate"; path: RedirectPath };

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
      console.error("An error occurred setting the session in supabase", error);
      return { status: "error" };
    }
    return { status: "navigate", path: resolveRedirectPath(effectiveType) };
  }

  if (!code) {
    console.error("Invalid or missing verification code. The link may have expired.");
    return { status: "error" };
  }

  const [{ error }] = await Promise.all([supabase.auth.exchangeCodeForSession(code), minDelay()]);
  if (error) {
    console.error("Failed to exchange code for session", error);
    return { status: "error" };
  }

  return { status: "navigate", path: resolveRedirectPath(effectiveType) };
}

function resolveRedirectPath(type: string | null | undefined): RedirectPath {
  switch (type) {
    case "invite":
      return "/auth/set-password";
    default:
      return "/dashboard";
  }
}
