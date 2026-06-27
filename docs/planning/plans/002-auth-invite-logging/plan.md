---
title: "Auth & invite logging: Execution Plan"
number: "002"
status: done
created: "2026-06-27"
updated: "2026-06-27"
idea: "2026-06-27-production-logging-tracing.md"
started: ""
completed: ""
estimated-hours: ""
tags: [observability, logging, auth, invite]
depends-on: "001-logging-foundation"
---

# Auth & invite logging

## Overview

Instrument the auth/confirm and invite/accept flows — the exact paths that failed
silently for Sam — using the logger from PR 001. After this PR, a failed password
reset or invite acceptance leaves a structured log line naming the reason. Depends
on `001-logging-foundation` being merged. Implements idea
`2026-06-27-production-logging-tracing.md`.

This is PR 2 of 3. Verifiable by reproducing a failed `/auth/confirm` (expired or
missing token) and seeing the logged reason instead of a silent `/login` redirect.

## Background — why these paths

The link in Sam's email pointed at
`/auth/confirm?token_hash=...&type=recovery&next=/auth/reset-password`. The route
loader throws `redirect({ to: "/login" })` on both a missing token and a failed
OTP verification, with no log of which happened or why. The invite flow
(`inviteUserByEmail` → `/auth/callback`) has `console.error`s but they were going
nowhere in prod (observability was off, fixed in PR 001).

## Phases

### Phase 1 — auth/confirm route (the silent redirect)

**File: `src/routes/auth/confirm.tsx`**

1. Before `redirect({ to: "/login" })` at the missing-token guard, log
   `log.warn("auth.confirm", "missing token or type", { hasToken, type })`.
   Do **not** log the token value itself.
2. Before the `redirect({ to: "/login" })` on `!result.success`, log
   `log.warn("auth.confirm", "otp verification failed", { type: deps.type })`.
3. On success, log `log.info("auth.confirm", "verified", { type: deps.type, next: deps.next })`
   before the success redirect.

### Phase 2 — auth server helpers

**File: `src/lib/auth/auth.server.ts`**

4. `verifyOtpToken` (line ~83): replace
   `console.error("Failed to verify OTP", error)` with
   `log.error("auth.otp", "verify failed", { type, error })` (error serialized by
   the logger).
5. `assertAdmin` / `assertAdminOrStaff` (lines ~98, ~112): replace the two
   `console.error` profile-fetch failures with
   `log.error("auth.role", "profile fetch failed", { error })`.

**File: `src/lib/auth/callback.ts`**

6. Line ~33 (set session): `log.error("auth.callback", "set session failed", { error })`.
7. Line ~40 (missing code): `log.warn("auth.callback", "missing verification code")`.
8. Line ~46 (exchange): `log.error("auth.callback", "code exchange failed", { error })`.
9. On the two success returns, add
   `log.info("auth.callback", "verified", { type: effectiveType })`.

**File: `src/lib/auth/changePassword.server.ts`**

10. Line ~63: replace with
    `log.error("auth.password", "record changed-at failed", { error })`.

### Phase 3 — invite send/resend (admin path)

**File: `src/lib/users/users.repository.ts`**

11. `inviteUserByEmail` (line ~259): replace `console.error("Failed to send invite:", error)`
    with `log.error("invite", "send failed", { email, error })`.
12. `resendInvite` (line ~293): replace with
    `log.error("invite", "resend failed", { email, error })`.
13. On the success paths of both methods, add
    `log.info("invite", "sent", { email })` / `log.info("invite", "resent", { email })`.

> Repository is the Supabase boundary; logging the raw Supabase error here is
> appropriate. The repository imports `log` directly (it is not unit-tested — covered
> by e2e — so no `deps` injection needed at this layer).

## Verification Checklist

1. `vp fmt`
2. `vp lint`
3. `vp check`
4. `vp test`
5. `vp build`
6. Manual repro (the core verification):
   - `supabase start` + `vp dev`.
   - Hit `/auth/confirm?type=recovery` with **no** `token_hash` → confirm a
     `auth.confirm missing token or type` warn line appears, then redirect to `/login`.
   - Hit `/auth/confirm?token_hash=bogus&type=recovery&next=/auth/reset-password`
     → confirm a `auth.otp verify failed` error line + `auth.confirm otp
verification failed` warn line, then `/login`.
   - Trigger an invite from the manage/users screen → confirm `invite sent` info
     line with the email.
7. `vp exec playwright test` (invite e2e still green — proves no behavioral regression).

## Done when

- A failed `/auth/confirm` produces a structured log line naming the reason
  (missing token vs. verify failure) instead of a silent redirect.
- Invite send/resend log both success and failure with the target email.
- All existing auth/invite `console.*` calls converted to `log.*`.
- Existing tests + invite e2e still pass.

## Rollback Plan

- Revert the PR. All changes are log-statement swaps and additions; no control flow
  or auth behavior changes, so revert is safe and behavior-neutral.

## Notes for the Sam issue

After this ships, ask Sam to retry with a freshly generated invite/reset link
(the original token was >10 days old and almost certainly expired). The new logs
will show whether the retry hits `otp verify failed` (token expired/consumed) or a
different path — turning a blind guess into a definite diagnosis.
