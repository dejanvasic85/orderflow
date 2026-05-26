import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function fetchSession() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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

export async function verifyOtpToken(token_hash: string, type: string, next: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as EmailOtpType,
  });

  if (error) {
    console.error("Failed to verify OTP", error);
    return { success: false as const };
  }

  return { success: true as const, next };
}
