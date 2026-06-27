import { log } from "@/lib/log/logger";
import { notifyPasswordChanged } from "@/lib/notifications/notifications.server";
import { err, ok, type Result } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
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

  await recordPasswordChangedAt(supabase, user.id);
  await notifyPasswordChanged({ email: user.email });

  const admin = createSupabaseAdminClient();
  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { must_change_password: false },
  });

  if (metaError) {
    return err({ message: metaError.message });
  }

  return ok();
}

async function recordPasswordChangedAt(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ password_changed_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    log.error("auth.password", "record changed-at failed", { error });
  }
}

export async function fetchPasswordChangedAt(): Promise<
  Result<string | null, { message: string }>
> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return err({ message: "Unauthorized" });
  }

  const { data, error } = await supabase
    .from("users")
    .select("password_changed_at")
    .eq("id", user.id)
    .single();
  if (error) {
    return err({ message: error.message });
  }

  return ok(data.password_changed_at);
}
