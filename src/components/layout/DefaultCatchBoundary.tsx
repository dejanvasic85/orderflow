import { Link, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Friendly fallback rendered when a route's loader or component throws. Users see
 * a reassuring message and recovery actions — never the raw error. The technical
 * detail is logged to the console and only surfaced on screen during development.
 */
export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();

  console.error("Route error caught by DefaultCatchBoundary:", error);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Empty className="max-w-md border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>
            We hit an unexpected problem loading this page. Please try again — if it keeps
            happening, refresh or head back home.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => router.invalidate()}>
              <RefreshCwIcon aria-hidden />
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Go home</Link>
            </Button>
          </div>
          {import.meta.env.DEV && error instanceof Error ? (
            <pre className="mt-2 max-w-full overflow-x-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
              {error.message}
            </pre>
          ) : null}
        </EmptyContent>
      </Empty>
    </main>
  );
}
