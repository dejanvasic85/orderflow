---
title: "Domain logging rollout: Execution Plan"
number: "003"
status: planning
created: "2026-06-27"
updated: "2026-06-27"
idea: "2026-06-27-production-logging-tracing.md"
started: ""
completed: ""
estimated-hours: ""
tags: [observability, logging, orders, users, notifications]
depends-on: "002-auth-invite-logging"
---

# Domain logging rollout

## Overview

Convert the remaining `console.*` calls to the structured logger and add a handful
of audit/success events across orderRequests, users, and notifications. The
orderRequests/users **service** layers receive the logger via `deps` to stay pure
and unit-testable (per AGENTS.md service layering); repositories and `.server.ts`
helpers import `log` directly. Depends on PR 001 (logger) and PR 002 (auth/invite
already done). Implements idea `2026-06-27-production-logging-tracing.md`.

This is PR 3 of 3. Verifiable per-event: each converted/added log appears with the
expected structured fields, and updated service unit tests assert the logger
(passed as a `deps` fake) was called.

## Phases

### Phase 1 — Logger as a service dependency

**Files: `src/lib/orderRequests/orderRequests.service.ts`,
`src/lib/orderRequests/orderRequests.functions.ts`,
`src/lib/users/users.service.ts`, `src/lib/users/users.functions.ts`**

1. Add `log` to the service `deps` type (e.g. extend `OrderRequestServiceDeps` and
   the users service deps with a `log: Logger` field). Define a minimal `Logger`
   type in `src/lib/log/logger.ts` and export it.
2. In the `.functions.ts` transport adapters, pass the real `log` into `deps`
   when constructing the service collaborators (alongside `repo`, `session`,
   `authorize`, `notify`).
3. This keeps services Supabase-free **and** logger-injectable so unit tests assert
   on a `vi.fn()` logger without module mocking.

### Phase 2 — orderRequests

**File: `src/lib/orderRequests/orderRequests.repository.ts`**

4. The 6 `return err({ message: error.message })` sites (lines ~55, 68, 79, 98,
   117, 121) currently swallow DB errors. Add a `log.error("order.db", "<op> failed",
{ error })` immediately before each `err(...)`, naming the operation (e.g.
   `fetch history`, `create order`, `insert items`). Repository imports `log`
   directly.

**File: `src/lib/orderRequests/orderRequests.service.ts`**

5. `placeOrder`: on success (after `createOrderWithItems` ok), add
   `deps.log.info("order.placed", "created", { orderId, userId, accountId })`.
   On `!result.ok`, add `deps.log.warn("order.placed", "failed", { userId })`
   before returning.
6. `placeOrderOnBehalf`: rely on the `placeOrder` log plus an
   `deps.log.info("order.placed", "on behalf", { actorId })` for the staff actor.

**File: `src/lib/orderRequests/orderRequests.service.test.ts`**

7. Add assertions to existing tests (or new ones) that `deps.log.info` is called
   with `"order.placed"` on success and `deps.log.warn` on repo failure. Pass a
   `{ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }` fake.

### Phase 3 — users

**File: `src/lib/users/users.service.ts`**

8. Line ~112 (ban sync rollback): `deps.log.error("user.ban", "sync failed, rolled
back active flag", { userId, error })`.
9. Line ~153 (post-invite DB update rollback): `deps.log.error("invite", "db update
failed, rolled back auth user", { email, error })`.
10. Line ~161 (the multi-line console.error — inspect and convert to a single
    structured call): `deps.log.error("invite", "<reason>", { ...context, error })`.
11. Line ~251 (`console.info("[admin] password set ...")`): convert to
    `deps.log.info("admin.password", "set for user", { userId: data.userId,
actorId: sessionUser.id })`.

**File: `src/lib/users/users.service.test.ts`**

12. Assert the logger fake is called on the rollback paths.

### Phase 4 — notifications

**File: `src/lib/notifications/notifications.server.ts`** (server helper — imports
`log` directly, not via deps)

13. Convert all 9 `console.*` sites (lines ~39, 44, 59, 74, 102, 105, 112, 141, 153)
    to structured events: - recipient fetch failures → `log.error("notify.recipients", "<which> fetch
failed", { error })` - email send failure → `log.error("notify.email", "send failed", { error })` - sms send failure → `log.error("notify.sms", "send failed", { error })` - no recipients (currently `console.warn`) → `log.warn("notify", "no recipients",
{ context })` - password-changed / admin-password-set email failures → matching `notify.email`
    events.

**Files: `src/lib/notifications/sms.ts` (line ~13),
`src/lib/notifications/email.ts` (line ~91)**

14. The "AWS not configured — would send" branches: convert to
    `log.debug("notify.sms"/"notify.email", "skipped — AWS not configured", { to })`.
    Debug level so they're quiet in prod but visible locally.

### Phase 5 — remaining client-side

**File: `src/routes/forgot-password.tsx` (line ~21)**

15. This is client-side. Either (a) leave as `console.log` for now with a `// client`
    note, or (b) add a minimal client log call if the logger's dev/prod detection
    works client-side. Default to (a) to keep this PR server-focused; note it as a
    follow-up if a client logger is wanted.

## Verification Checklist

1. `vp fmt`
2. `vp lint`
3. `vp check`
4. `vp test` (service tests now assert logger calls)
5. `vp build`
6. `grep -rn "console\.\(log\|error\|warn\|info\)" src --include=*.ts --include=*.tsx
| grep -v "\.test\."` returns only the intentional client-side site(s).
7. Manual spot-check under `vp dev`: place an order → `order.placed created` line;
   trigger a notification with a misconfigured recipient → `notify.*` error line.

## Done when

- No unintended `console.*` remain in server `src` code.
- orderRequests + users services receive `log` via `deps`; their tests assert on it.
- notifications and order/user repositories emit structured events on failure.
- Key success/audit events (`order.placed`, `admin.password set`, `invite sent`)
  are present.

## Rollback Plan

- Revert the PR. Changes are log-statement conversions plus `deps` plumbing; the
  `deps.log` additions are backward-compatible if the field is optional, but since
  this is a clean revert the simplest rollback is `git revert`.

## Follow-ups (out of scope)

- Client-side structured logging (`forgot-password.tsx` and other route components).
- `reqId` propagation into service/domain logs (needs an SSR-safe context
  mechanism on Workers).
- Sentry / OTLP export destination, if richer error reporting + replay is wanted
  later (the dead dep removed in PR 001 can be re-added deliberately then).
