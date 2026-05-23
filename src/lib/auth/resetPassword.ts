import { createServerFn } from "@tanstack/react-start";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type VerifyInput = { token_hash: string; type: "recovery" };

export const verifyResetToken = createServerFn({ method: "GET" })
  .inputValidator((data: VerifyInput) => data)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: data.type,
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
  });
