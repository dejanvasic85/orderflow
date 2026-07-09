import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/**
 * Tracks which nav destination is currently being navigated to, keeping the
 * pending flag on for a minimum duration so the feedback is always perceptible
 * — even when a route loads in a single frame on a fast connection.
 *
 * Returns a predicate: `isPending(to)` is true while a navigation *to* a path
 * that starts with `to` is in flight (or within the minimum-visible window).
 */
export function useNavPending(minDuration = 250): (to: string) => boolean {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const pendingTo = useRouterState({
    select: (s) => (s.isLoading ? s.location.pathname : undefined),
  });

  const [target, setTarget] = useState<string | undefined>(undefined);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading && pendingTo) {
      setTarget(pendingTo);
      shownAt.current = Date.now();
      return;
    }

    if (target === undefined) return;

    const elapsed = shownAt.current ? Date.now() - shownAt.current : minDuration;
    const remaining = minDuration - elapsed;

    if (remaining <= 0) {
      setTarget(undefined);
      shownAt.current = null;
      return;
    }

    const id = setTimeout(() => {
      setTarget(undefined);
      shownAt.current = null;
    }, remaining);
    return () => clearTimeout(id);
  }, [isLoading, pendingTo, target, minDuration]);

  return (to: string) => target !== undefined && target.startsWith(to);
}
