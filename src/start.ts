import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { createRequestLogger } from "@/lib/log/logger";
import { prettyRequestPath } from "@/lib/log/requestPath";

// TanStack Start auto-installs CSRF protection for server functions only when
// src/start.ts is absent. Because this file exists (for the request logger), we
// must re-add it explicitly, or server-fn RPC endpoints accept cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const requestLogger = createMiddleware().server(async ({ request, next }) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = createRequestLogger(reqId);
  const method = request.method;
  // Pathname only — query strings can contain token_hash and other secrets.
  const path = prettyRequestPath(new URL(request.url).pathname);
  const startTime = Date.now();

  try {
    const result = await next();
    const durationMs = Date.now() - startTime;
    log.info("request", "handled", {
      method,
      path,
      status: result.response.status,
      durationMs,
    });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error("request", "error", { method, path, durationMs, error });
    throw error;
  }
});

// requestLogger first so a CSRF rejection is logged as a request error.
export const startInstance = createStart(() => ({
  requestMiddleware: [requestLogger, csrfMiddleware],
}));
