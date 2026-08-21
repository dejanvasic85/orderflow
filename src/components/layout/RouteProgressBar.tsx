import { useRouterState } from "@tanstack/react-router";
import { useDelayedBoolean } from "@/hooks/use-delayed-boolean";

/** Top-of-viewport progress bar shown while the router resolves a navigation. */
export function RouteProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const show = useDelayedBoolean(isLoading);

  if (!show) return null;

  return (
    <div
      className="route-progress-track"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="route-progress-bar" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
