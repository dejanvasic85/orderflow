---
title: Production logging & tracing
status: in-progress
created: "2026-06-27"
plan: "001-logging-foundation/plan.md"
tags: [observability, logging, infra]
---

# Production logging & tracing

## Problem

We have no usable production logs. An invitation/password-reset link sent to a real
user (Sam) didn't work and we had nothing to diagnose it — the failing path in
`src/routes/auth/confirm.tsx` throws a redirect to `/login` with no log of why.

Cloudflare observability is effectively off: `wrangler.jsonc` has
`observability.enabled: false` (master switch), so even existing `console.*` calls
are not persisted. `@sentry/tanstackstart-react` is installed but never wired up.

## Decisions (made 2026-06-27)

- **Cloudflare Workers Logs + automatic traces first.** No Sentry yet; remove the
  dead `@sentry/tanstackstart-react` dependency.
- **Tiny custom JSON logger** — pretty/colorized in dev, structured JSON in prod,
  auto-detected by environment. No pino (Node-stream oriented, awkward on Workers).
- **Explicit request start/end middleware** with a per-request `reqId`.
- **Structured key events** rolled out across domains; service layer receives the
  logger via `deps` to stay pure and unit-testable.

## Outcome

Three verifiable PRs:

1. `001-logging-foundation` — logger util, CF observability on, request middleware.
2. `002-auth-invite-logging` — instrument the auth/confirm + invite flow (Sam's bug).
3. `003-domain-logging-rollout` — convert remaining `console.*` and add audit events
   across orderRequests, users, notifications.
