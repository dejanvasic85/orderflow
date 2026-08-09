import * as Sentry from "@sentry/tanstackstart-react";
import { sentryTracesSampleRate } from "@/lib/log/constants";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enableLogs: true,
  tracesSampleRate: sentryTracesSampleRate,
});
