import type { SetPasswordResult } from "@/components/auth/SetPasswordForm";
import { log } from "@/lib/log/logger";
import { err, ok } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabaseServer";
import { createUserRepository } from "@/lib/users/users.repository";

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

  // Best-effort, distinct from invite_accepted_at: mark now so the Users list
  // doesn't stay "Pending" even if the metadata write below fails.
  const markResult = await createUserRepository().markPasswordSet(user.id);
  if (!markResult.ok) {
    log.error("auth.password", "failed to mark password_set_at", {
      userId: user.id,
      error: markResult.error.message,
    });
  }

  const admin = createSupabaseAdminClient();
  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { must_change_password: false },
  });

  if (metaError) {
    return err({ message: metaError.message });
  }

  return ok();
}
