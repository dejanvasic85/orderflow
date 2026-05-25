import { type EmailOtpType } from "@supabase/supabase-js";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const confirmSearchSchema = z.object({
  token_hash: z.string().optional(),
  type: z.string().optional(),
  next: z.string().optional(),
});

const verifyOtp = createServerFn({ method: "GET" })
  .inputValidator((data: { token_hash: string; type: string; next: string }) => data)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: data.type as EmailOtpType,
    });

    if (error) {
      console.error("Failed to verify OTP", error);
      return { success: false as const };
    }

    return { success: true as const, next: data.next };
  });

export const Route = createFileRoute("/auth/confirm")({
  validateSearch: confirmSearchSchema,
  loaderDeps: ({ search }) => ({
    token_hash: search.token_hash ?? "",
    type: search.type ?? "",
    next: search.next ?? "/dashboard",
  }),
  loader: async ({ deps }) => {
    if (!deps.token_hash || !deps.type) {
      throw redirect({ to: "/login" });
    }

    const result = await verifyOtp({
      data: { token_hash: deps.token_hash, type: deps.type, next: deps.next },
    });

    if (!result.success) {
      throw redirect({ to: "/login" });
    }

    throw redirect({ to: result.next as "/" });
  },
});
