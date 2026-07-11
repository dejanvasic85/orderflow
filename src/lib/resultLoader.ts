import { notFound } from "@tanstack/react-router";
import type { Result } from "@/lib/result";

// For route loaders / mutation callbacks: throws so the router error boundary
// (or react-query's error handling) takes over, instead of hand-checking `.ok`.
export function unwrapOrThrow<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

// For route loaders: throws TanStack Router's notFound() when a fetched
// entity is missing, instead of hand-checking `.value` for null/undefined.
export function valueOrNotFound<T>(value: T | null | undefined): NonNullable<T> {
  if (value === null || value === undefined) throw notFound();
  return value;
}
