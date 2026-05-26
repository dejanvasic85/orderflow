import type { SetPasswordResult } from "@/components/auth/SetPasswordForm";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function updatePassword(password: string): Promise<SetPasswordResult> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return err({ message: error.message });
  }
  return ok();
}
