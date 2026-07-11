export type ResultError = { message: string; cause?: unknown };

export type Result<T, E = ResultError> = { ok: true; value: T } | { ok: false; error: E };

export function ok(): Result<void, never>;
export function ok<T>(value: T): Result<T, never>;
export function ok<T>(value?: T) {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion, typescript/consistent-type-assertions -- overload signature can't be expressed without this cast
  return { ok: true, value } as Result<T, never>;
}
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// TanStack Start serializes server function returns over HTTP, losing the inferred type.
// Use this at call sites to restore type safety when the inferred return is `unknown`.
export function asResult<T, E = ResultError>(value: unknown): Result<T, E> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- sanctioned boundary cast: restores the type lost when createServerFn serializes its return
  return value as Result<T, E>;
}

export function mapResult<T, U, E = ResultError>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (!result.ok) return result;
  return ok(fn(result.value));
}

export function unwrapOr<T, E = ResultError>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

type Results<T extends readonly unknown[]> = { [K in keyof T]: Result<T[K]> };

export function combine<T extends readonly unknown[]>(
  results: readonly [...Results<T>],
): Result<T> {
  const firstError = results.find((r) => !r.ok);
  if (firstError && !firstError.ok) return firstError;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- every result is confirmed ok above; T is the tuple of their values
  return ok(results.map((r) => (r.ok ? r.value : undefined)) as unknown as T);
}
