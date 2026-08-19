import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ConfirmView } from "@/components/auth/ConfirmView";
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
  loader: ({ deps }) => {
    if (!deps.token_hash || !deps.type) {
      log.warn("auth.confirm", "missing token or type", {
        hasToken: !!deps.token_hash,
        type: deps.type,
      });
      throw redirect({ to: "/login" });
    }
    return deps;
  },
  component: ConfirmPage,
});

function ConfirmPage() {
  const { token_hash, type, next } = Route.useLoaderData();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    setSubmitting(true);
    const result = await verifyOtp({ data: { token_hash, type, next } });

    if (!result.success) {
      log.warn("auth.confirm", "otp verification failed", { type });
      setSubmitting(false);
      setError("This link is invalid or has already been used. Please request a new one.");
      return;
    }

    log.info("auth.confirm", "verified", { type, next: result.next });
    // `next` is a runtime redirect target (from search params or a server default);
    // TanStack Router's `to` requires a literal route path, which can't be proven statically here.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    await navigate({ to: result.next as "/" });
  };

  return <ConfirmView error={error} submitting={submitting} onContinue={handleContinue} />;
}
