import type { SupabaseClient } from "@supabase/supabase-js";
import type { SetPasswordResult } from "@/components/auth/SetPasswordForm";

type UpdatePasswordParams = {
  supabase: SupabaseClient;
  password: string;
  navigate: () => Promise<void>;
};

export async function updatePassword({
  supabase,
  password,
  navigate,
}: UpdatePasswordParams): Promise<SetPasswordResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }
  await navigate();
}
