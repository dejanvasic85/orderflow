import type { SupabaseClient } from "@supabase/supabase-js";

const minDelay = () => new Promise((resolve) => setTimeout(resolve, 3000));

type VerifyParams = {
  supabase: SupabaseClient;
  code: string | undefined;
  hash: string;
  effectiveType: string | null | undefined;
  navigate: (to: string) => Promise<void>;
  setError: (msg: string) => void;
};

export async function verifyCallback({
  supabase,
  code,
  hash,
  effectiveType,
  navigate,
  setError,
}: VerifyParams): Promise<void> {
  const hashParams = new URLSearchParams(hash.slice(1));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") ?? "";

  if (accessToken) {
    const [{ error }] = await Promise.all([
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
      minDelay(),
    ]);
    if (error) {
      setError(error.message);
      return;
    }
    await navigate(effectiveType === "invite" ? "/auth/set-password" : "/dashboard");
    return;
  }

  if (!code) {
    setError("Invalid or missing verification code. The link may have expired.");
    return;
  }

  const [{ error }] = await Promise.all([supabase.auth.exchangeCodeForSession(code), minDelay()]);
  if (error) {
    setError(error.message);
    return;
  }
  await navigate(effectiveType === "invite" ? "/auth/set-password" : "/dashboard");
}
