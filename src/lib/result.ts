export type ResultError = { message: string; cause?: unknown };

export type Result<T, E = ResultError> = { ok: true; value: T } | { ok: false; error: E };

export function ok(): Result<void, never>;
export function ok<T>(value: T): Result<T, never>;
export function ok<T>(value?: T) {
  return { ok: true, value } as Result<T, never>;
}
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// TanStack Start serializes server function returns over HTTP, losing the inferred type.
// Use this at call sites to restore type safety when the inferred return is `unknown`.
export function asResult<T, E = ResultError>(value: unknown): Result<T, E> {
  return value as Result<T, E>;
}
