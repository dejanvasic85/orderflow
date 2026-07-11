import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/**
 * Tracks which nav destination is currently being navigated to, keeping the
 * pending flag on for a minimum duration so the feedback is always perceptible
 * — even when a route loads in a single frame on a fast connection.
 *
 * Returns a predicate: `isPending(to, siblings?)` is true while a navigation to
 * a path that starts with `to` is in flight (or within the minimum-visible
 * window). When `siblings` is supplied, only the single most specific (longest)
 * matching path is reported as pending, so sibling tabs whose paths are prefixes
 * of each other (e.g. `/accounts/x` vs `/accounts/x/orders/new`) don't both
 * light up — only the tab actually being navigated to does.
 */
export function useNavPending(
  minDuration = 250,
): (to: string, siblings?: readonly string[]) => boolean {
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

  return (to: string, siblings?: readonly string[]) => {
    if (target === undefined || !target.startsWith(to)) return false;
    if (!siblings) return true;

    // Among sibling nav targets that also prefix the pending path, only the
    // longest (most specific) one wins, so a parent tab doesn't spin when a
    // nested sibling is the real destination.
    const bestMatch = siblings
      .filter((s) => target.startsWith(s))
      .reduce((longest, s) => (s.length > longest.length ? s : longest), "");
    return to === bestMatch;
  };
}
