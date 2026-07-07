function hasMessage(error: unknown): error is { message?: string } {
  return typeof error === "object" && error !== null && Object.hasOwn(error, "message");
}

export function toFieldErrors(errors: unknown[]): { message?: string }[] {
  return errors.map((e) => ({
    message: typeof e === "string" ? e : hasMessage(e) ? e.message : undefined,
  }));
}
