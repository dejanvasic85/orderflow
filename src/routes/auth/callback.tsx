import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AuthCallbackView } from "@/components/auth/AuthCallbackView";
import { verifyCallback } from "@/lib/auth/callbackVerify";
import { supabase } from "@/lib/supabase";

const callbackSearchSchema = z.object({
  code: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: callbackSearchSchema,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { code, type } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    const hashParams = new URLSearchParams(hash.slice(1));
    const effectiveType = type ?? hashParams.get("type");

    const startVerification = async () => {
      const result = await verifyCallback({ supabase, code, hash, effectiveType });

      if (result.status === "error") {
        setError("Your link is invalid or has expired. Please request a new one.");
        return;
      }

      await navigate({ to: result.path });
    };

    void startVerification();
  }, [code, type, navigate]);

  return <AuthCallbackView error={error} />;
}
