export type AppError =
  | { kind: "not_found"; message: string }
  | { kind: "unauthorized"; message: string }
  | { kind: "forbidden"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "unknown"; message: string };

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function fromSupabaseError(error: { message: string }): AppError {
  return { kind: "unknown", message: error.message };
}

// TanStack Start serializes server function returns over HTTP, losing the inferred type.
// Use this at call sites to restore type safety when the inferred return is `unknown`.
export function asResult<T, E = AppError>(value: unknown): Result<T, E> {
  return value as Result<T, E>;
}
