import type { SetPasswordResult } from "@/components/auth/SetPasswordForm";
import { err, ok } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function updatePassword(password: string): Promise<SetPasswordResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
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

  return ok();
}
