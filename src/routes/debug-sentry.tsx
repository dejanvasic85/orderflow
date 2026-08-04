import { createFileRoute } from "@tanstack/react-router";
import { DebugSentryPanel } from "@/components/DebugSentryPanel";
import { throwServerError } from "@/lib/debug/debugSentry.functions";

export const Route = createFileRoute("/debug-sentry")({ component: DebugSentryRoute });

function DebugSentryRoute() {
  const handleThrowServerError = () => {
    void throwServerError();
  };

  return <DebugSentryPanel onThrowServerError={handleThrowServerError} />;
}
