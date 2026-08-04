import { createServerFn } from "@tanstack/react-start";

export const throwServerError = createServerFn({ method: "POST" }).handler(async () => {
  throw new Error("Sentry verification: deliberate server function error");
});
