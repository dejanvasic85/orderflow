import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/auth.functions";
import { log } from "@/lib/log/logger";

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
      log.warn("auth.confirm", "missing token or type", {
        hasToken: !!deps.token_hash,
        type: deps.type,
      });
      throw redirect({ to: "/login" });
    }

    const result = await verifyOtp({
      data: { token_hash: deps.token_hash, type: deps.type, next: deps.next },
    });

    if (!result.success) {
      log.warn("auth.confirm", "otp verification failed", { type: deps.type });
      throw redirect({ to: "/login" });
    }

    log.info("auth.confirm", "verified", { type: deps.type, next: deps.next });
    // `next` is a runtime redirect target (from search params or a server default);
    // TanStack Router's `to` requires a literal route path, which can't be proven statically here.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    throw redirect({ to: result.next as "/" });
  },
});
