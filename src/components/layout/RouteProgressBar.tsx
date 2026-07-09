import { useRouterState } from "@tanstack/react-router";
import { useDelayedBoolean } from "@/hooks/use-delayed-boolean";

/**
 * A thin, brand-coloured progress bar pinned to the top of the viewport that
 * animates while the router is resolving a navigation (running loaders). It is
 * the ambient counterpart to the per-link pending state: instant reassurance
 * that the app is working during the sub-second loader window.
 *
 * A short delay avoids flashing the bar on near-instant navigations, and a
 * minimum visible duration prevents a jarring flicker on fast ones.
 */
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
