import type { EmailOtpType } from "@supabase/supabase-js";
import { log } from "@/lib/log/logger";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function fetchSession() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Decode user_role from the session JWT (custom claim set by Supabase RLS trigger)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  let userRole: string | undefined;
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
      userRole = payload.user_role as string | undefined;
    } catch {
      // ignore decode errors
    }
  }

  return { ...user, user_role: userRole };
}

export async function fetchSessionOrThrow() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function verifyResetTokenFromOtp(token_hash: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: "recovery",
  });

  if (!error) {
    return { valid: true as const };
  }

  // Token may already be consumed — check for an existing valid session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return { valid: true as const };
  }

  return { valid: false as const, error: error.message };
}

export async function sendPasswordReset(email: string, siteUrl: string) {
  const supabase = createSupabaseServerClient();
  const redirectTo = `${siteUrl}/auth/confirm?next=/auth/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    return { success: false as const, message: error.message };
  }
  return { success: true as const };
}

export async function verifyOtpToken(token_hash: string, type: string, next: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as EmailOtpType,
  });

  if (error) {
    log.error("auth.otp", "verify failed", { type, error });
    return { success: false as const };
  }

  return { success: true as const, next };
}

export async function assertAdmin(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const sessionUser = await fetchSessionOrThrow();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", sessionUser.id)
    .single();
  if (profileError) {
    log.error("auth.role", "profile fetch failed", { error: profileError });
    throw new Error("Unauthorized");
  }
  if (profile.role !== "admin") throw new Error("Forbidden");
}

export async function assertAdminOrStaff(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const sessionUser = await fetchSessionOrThrow();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", sessionUser.id)
    .single();
  if (profileError) {
    log.error("auth.role", "profile fetch failed", { error: profileError });
    throw new Error("Unauthorized");
  }
  if (profile.role !== "admin" && profile.role !== "staff") throw new Error("Forbidden");
}
