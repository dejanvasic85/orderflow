import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/**
 * Returns `isPending(to, siblings?)`, true while navigation to a path prefixed
 * by `to` is in flight, held for a minimum duration so feedback stays visible.
 * With `siblings`, only the longest (most specific) matching path is pending.
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

    const bestMatch = siblings
      .filter((s) => target.startsWith(s))
      .reduce((longest, s) => (s.length > longest.length ? s : longest), "");
    return to === bestMatch;
  };
}
