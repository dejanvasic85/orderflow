import type { SetPasswordResult } from "@/components/auth/SetPasswordForm";
import { log } from "@/lib/log/logger";
import { err, ok } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabaseServer";

export async function updatePassword(password: string): Promise<SetPasswordResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await getAuthenticatedUser(supabase);
  if (userError || !user) {
    return err({ message: "Unauthorized" });
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return err({ message: error.message });
  }

  const admin = createSupabaseAdminClient();
  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { must_change_password: false },
  });

  if (metaError) {
    return err({ message: metaError.message });
  }

  // Best-effort: distinct from invite_accepted_at (set when the invite token is
  // verified) so the Users list status badge reflects a usable password, not just
  // a clicked link. Don't fail the whole request if this secondary write fails.
  const { error: markError } = await supabase
    .from("users")
    .update({ password_set_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("password_set_at", null);
  if (markError) {
    log.error("auth.password", "failed to mark password_set_at", {
      userId: user.id,
      error: markError.message,
    });
  }

  return ok();
}
