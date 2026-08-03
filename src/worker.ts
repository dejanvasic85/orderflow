import * as Sentry from "@sentry/cloudflare";
import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import tanstackEntry from "@tanstack/react-start/server-entry";
import { log } from "@/lib/log/logger";
import { prettyRequestPath } from "@/lib/log/requestPath";

const handler = {
  async fetch(request: Request): Promise<Response> {
    const reqId = crypto.randomUUID().slice(0, 8);
    const method = request.method;
    const path = prettyRequestPath(new URL(request.url).pathname);
    const startTime = Date.now();

    let response: Response;
    try {
      response = await tanstackEntry.fetch(request);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      log.error("request", "request threw before a response was produced", {
        reqId,
        method,
        path,
        durationMs,
        error,
      });
      throw error;
    }

    const durationMs = Date.now() - startTime;
    log.info("request", "request completed", {
      reqId,
      method,
      path,
      status: response.status,
      durationMs,
    });
    return response;
  },
};

export default Sentry.withSentry(
  () => ({
    dsn: import.meta.env.VITE_SENTRY_DSN,
  }),
  wrapFetchWithSentry(handler),
);
