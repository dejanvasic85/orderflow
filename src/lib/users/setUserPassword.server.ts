import { ensureSession } from "@/lib/auth/auth.functions";
import { sendPasswordReset } from "@/lib/auth/auth.server";
import { err, ok } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { assertAdmin } from "./users.server";

export async function adminSetUserPassword(data: { userId: string; password: string }) {
  const supabase = createSupabaseServerClient();
  await assertAdmin(supabase);

  const session = await ensureSession();
  if (data.userId === session.id) {
    return err({ message: "Use account settings to change your own password" });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(data.userId, {
    password: data.password,
    user_metadata: { must_change_password: true },
  });

  if (error) {
    console.error("[admin] failed to set password for user", data.userId, error);
    return err({ message: error.message });
  }

  console.info("[admin] password set for user", data.userId, "by", session.id);
  return ok();
}

export async function adminSendPasswordReset(userId: string, siteUrl: string) {
  const supabase = createSupabaseServerClient();
  await assertAdmin(supabase);

  const { data: user, error } = await supabase
    .from("users_with_email")
    .select("email")
    .eq("id", userId)
    .single();

  if (error || !user?.email) {
    return err({ message: "User not found" });
  }

  return sendPasswordReset(user.email, siteUrl);
}
