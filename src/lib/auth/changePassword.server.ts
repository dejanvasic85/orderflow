import { notifyPasswordChanged } from "@/lib/notifications/notifications.server";
import { err, ok, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export async function changePassword(
  input: ChangePasswordInput,
): Promise<Result<void, { message: string }>> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return err({ message: "Unauthorized" });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });
  if (signInError) {
    return err({ message: "Current password is incorrect" });
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (updateError) {
    return err({ message: updateError.message });
  }

  await notifyPasswordChanged({ email: user.email });

  return ok();
}
