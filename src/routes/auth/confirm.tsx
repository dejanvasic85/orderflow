import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/auth.functions";

const confirmSearchSchema = z.object({
  token_hash: z.string().optional(),
  type: z.string().optional(),
  next: z.string().optional(),
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
