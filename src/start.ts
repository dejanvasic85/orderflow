import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// TanStack Start auto-installs CSRF protection for server functions only when
// src/start.ts is absent. Because this file exists, we must re-add it explicitly,
// or server-fn RPC endpoints accept cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}));
