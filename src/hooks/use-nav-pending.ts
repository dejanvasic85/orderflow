import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const noTargets: readonly string[] = [];

const rootPath = "/";

// Match whole path segments, so "/accounts" does not match "/accounts-archive".
const matchesTarget = (target: string, to: string): boolean =>
  to === rootPath ? target === rootPath : target === to || target.startsWith(`${to}/`);

const bestSibling = (target: string, siblings: readonly string[]): string =>
  siblings
    .filter((s) => matchesTarget(target, s))
    .reduce((longest, s) => (s.length > longest.length ? s : longest), "");

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

  // A redirect changes the pending pathname mid-load. Keep every pathname seen
  // in the load so the link that was clicked stays pending until it settles.
  const [targets, setTargets] = useState(noTargets);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading && pendingTo) {
      setTargets((seen) => (seen.includes(pendingTo) ? seen : [...seen, pendingTo]));
      shownAt.current ??= Date.now();
      return;
    }

    if (targets.length === 0) return;

    const elapsed = shownAt.current ? Date.now() - shownAt.current : minDuration;
    const remaining = minDuration - elapsed;

    if (remaining <= 0) {
      setTargets(noTargets);
      shownAt.current = null;
      return;
    }

    const id = setTimeout(() => {
      setTargets(noTargets);
      shownAt.current = null;
    }, remaining);
    return () => clearTimeout(id);
  }, [isLoading, pendingTo, targets, minDuration]);

  return (to: string, siblings?: readonly string[]) =>
    targets.some(
      (target) => matchesTarget(target, to) && (!siblings || to === bestSibling(target, siblings)),
    );
}
