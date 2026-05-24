import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";
import { verifyResetToken } from "@/lib/auth/resetPassword";
import { supabase } from "@/lib/supabase";

const searchSchema = z.object({
  token_hash: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    token_hash: search.token_hash ?? "",
    type: search.type ?? "",
  }),
  loader: async ({ deps }) => {
    if (!deps.token_hash || !deps.type || deps.type !== "recovery") {
      return { valid: false as const, error: "Invalid or missing reset link." };
    }
    return verifyResetToken({
      data: { token_hash: deps.token_hash, type: deps.type },
    });
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const loaderData = Route.useLoaderData();

  const handleReset = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { error: error.message };
    }
    await supabase.auth.signOut();
  };

  return (
    <ResetPasswordView
      valid={loaderData.valid}
      error={loaderData.valid ? undefined : loaderData.error}
      onReset={handleReset}
    />
  );
}
