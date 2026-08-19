import * as Sentry from "@sentry/tanstackstart-react";
import { sentryTracesSampleRate } from "@/lib/log/constants";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enableLogs: true,
  tracesSampleRate: sentryTracesSampleRate,
  // Injected by browser extensions (e.g. Grammarly) that talk to the page over
  // a postMessage RPC bridge; not thrown by our code, so it's not actionable.
  ignoreErrors: ["Non-Error promise rejection captured with value: Object Not Found Matching Id"],
});
