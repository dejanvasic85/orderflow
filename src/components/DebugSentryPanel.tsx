import { Button } from "@/components/ui/button";

type DebugSentryPanelProps = {
  onThrowServerError: () => void;
};

export function DebugSentryPanel({ onThrowServerError }: DebugSentryPanelProps) {
  const handleThrowClientError = () => {
    throw new Error("Sentry verification: deliberate client error");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1>Sentry verification</h1>
      <p className="max-w-md text-muted-foreground">
        Temporary page, not for merge. Each button throws a deliberate error to confirm it reaches
        Sentry from that surface.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="destructive" onClick={handleThrowClientError}>
          Throw client error
        </Button>
        <Button variant="destructive" onClick={onThrowServerError}>
          Throw server error
        </Button>
      </div>
    </main>
  );
}
