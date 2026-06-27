---
title: "Logging foundation: Execution Plan"
number: "001"
status: planning
created: "2026-06-27"
updated: "2026-06-27"
idea: "2026-06-27-production-logging-tracing.md"
started: ""
completed: ""
estimated-hours: ""
tags: [observability, logging, infra]
---

# Logging foundation

## Overview

Stand up the logging infrastructure: a tiny functional logger that renders
pretty/colorized lines in local dev and structured JSON in production, turn on
Cloudflare Workers Logs + automatic tracing, add global request start/end
middleware with a per-request `reqId`, and remove the dead Sentry dependency.
This PR introduces **no domain logging** — it only provides the tools the next two
PRs consume. Implements idea `2026-06-27-production-logging-tracing.md`.

This is PR 1 of 3. It must be independently verifiable: pretty logs visible in
`vp dev`, JSON logs when built for prod, request lines on every request, and a
passing test suite for the logger.

## Phases

### Phase 1 — Enable Cloudflare observability & remove dead dep

**File: `wrangler.jsonc`**

1. Change `observability.enabled` from `false` to `true`. This is the master
   switch — with it off, the nested `logs`/`traces` config does nothing and prod
   persists no logs.
2. Leave the existing nested `logs` (`enabled`, `persist`, `invocation_logs`) and
   `traces` (`enabled`, `persist`) config as-is.
3. Confirm both the top-level `vars` block and the `env.production` block are
   untouched (no domain/var changes in this PR).

**File: `package.json`**

4. Remove the `@sentry/tanstackstart-react` dependency (installed but never
   imported anywhere in `src/`).
5. Run `vp install` to update the lockfile.

_Verification:_ `grep -rn "sentry" src` returns nothing; `wrangler.jsonc` shows
`observability.enabled: true`.

### Phase 2 — The logger

**File: `src/lib/log/constants.ts` (new)**

1. Export a single `as const` object for log config, e.g. `logConfigValue`,
   containing: ordered levels (`debug`, `info`, `warn`, `error`), and the ANSI
   color codes per level for dev rendering. Use camelCase keys, `Value` suffix per
   conventions.

**File: `src/lib/log/logger.ts` (new)**

2. Export a `log` object with `debug` / `info` / `warn` / `error` methods.
   Signature: `(event: string, msg: string, fields?: Record<string, unknown>) => void`.
   `event` is a short domain tag (e.g. `auth.confirm`), `msg` is the message,
   `fields` are arbitrary structured key/values.
3. Detect environment via `import.meta.env.DEV`. In dev → pretty render:
   `HH:MM:SS LEVEL  event  msg  key=value key=value` with the level colorized.
   In prod → `console.log(JSON.stringify({ level, event, msg, ts, ...fields }))`.
   Route `warn`/`error` through `console.warn`/`console.error` so Workers Logs
   classifies them correctly; `debug`/`info` through `console.log`.
4. Keep it functional and small — no classes, no external deps. Serialize `Error`
   values in `fields` to `{ name, message }` (never dump stacks into prod JSON
   unbounded; cap the stack or omit).
5. Export a `createRequestLogger(reqId: string)` helper (or accept an optional
   `reqId` field) so the request middleware and downstream callers can attach a
   correlation id. Keep the surface minimal — a thin wrapper that merges
   `{ reqId }` into `fields`.

**File: `src/lib/log/logger.test.ts` (new)**

6. Tests (DAMP, no logic, one behavior each):
   - `info` in prod mode emits a single JSON line with `level: "info"`, the event,
     msg, and a `ts`.
   - `warn` routes through `console.warn`.
   - `error` routes through `console.error`.
   - structured `fields` are merged into the JSON output.
   - an `Error` in `fields` is serialized to name/message (not `{}`).
   - dev mode renders a non-JSON string containing the level and event.
   - level filtering: `debug` below the configured threshold is suppressed (if a
     threshold is implemented).
   - Mock `import.meta.env.DEV` per-test via `vi.stubEnv` or equivalent; mock
     `console.*` with `vi.spyOn`.

_Verification:_ `vp test src/lib/log` passes; manual `log.info("test", "hello", { a: 1 })`
in a throwaway server fn shows pretty output under `vp dev`.

### Phase 3 — Global request middleware

**File: `src/start.ts` (new — does not exist yet)**

1. Create the TanStack Start entry per the 1.168 API:
   ```ts
   import { createStart, createMiddleware } from "@tanstack/react-start";
   import { log } from "@/lib/log/logger";
   ```
2. Define a `requestLogger` middleware via
   `createMiddleware().server(async ({ request, next }) => { ... })`:
   - Generate a short `reqId` (e.g. `crypto.randomUUID().slice(0, 8)`).
   - Log start: `log.info("request", "start", { reqId, method, path })`
     (derive `path` from `new URL(request.url).pathname` — avoid logging full query
     strings, which can contain `token_hash`).
   - `await next()`, measure duration, log end with `result.response.status` and
     `durationMs`. On thrown error, log `log.error("request", "error", {...})` and
     rethrow.
3. Export `startInstance = createStart(() => ({ requestMiddleware: [requestLogger] }))`.

**Note on `reqId` propagation:** threading `reqId` from request middleware into
deep service code is not reliable across the SSR boundary on Workers (no
guaranteed AsyncLocalStorage). For this PR the `reqId` lives on the request
start/end lines only. Domain events in PR 003 carry their own correlation
(userId, orderId, email). Do **not** over-engineer cross-cutting propagation here.

_Verification:_ under `vp dev`, every page/server-fn request prints a `request start`
and `request ... <status> (<ms>ms)` pair with a matching `reqId`.

## Verification Checklist

1. `vp fmt`
2. `vp lint`
3. `vp check`
4. `vp test`
5. `vp build`
6. Manual: `vp dev`, load a page, confirm pretty request lines in the terminal.
7. Manual (optional): `vp build` output / inspect that prod path emits JSON
   (e.g. temporary `import.meta.env.DEV === false` branch check or a unit test
   already covers this).

## Done when

- `observability.enabled: true` in `wrangler.jsonc`.
- `@sentry/tanstackstart-react` removed; no `sentry` references in `src`.
- `src/lib/log/logger.ts` + `constants.ts` exist with passing tests.
- `src/start.ts` logs request start/end with `reqId` on every request.
- No domain code changed yet (that's PR 002 / 003).

## Rollback Plan

- Revert the PR. The logger is additive and unused by domain code, so reverting
  has no behavioral impact beyond removing request lines.
- If CF observability causes unexpected cost/volume, set
  `observability.enabled: false` again (single-line change) without reverting code.
