# Plans Dashboard

| #   | Plan                                                         | Status | Depends on | Summary                                                                                               |
| --- | ------------------------------------------------------------ | ------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| 001 | [Logging foundation](001-logging-foundation/plan.md)         | done   | —          | Logger util (pretty dev / JSON prod), CF observability on, request middleware, remove dead Sentry dep |
| 002 | [Auth & invite logging](002-auth-invite-logging/plan.md)     | done   | 001        | Instrument auth/confirm + invite flow — diagnoses the Sam invite/reset bug                            |
| 003 | [Domain logging rollout](003-domain-logging-rollout/plan.md) | done   | 002        | Convert remaining `console.*`, add audit events across orders/users/notifications                     |

## Epic: Production logging & tracing

Idea: [2026-06-27-production-logging-tracing](../ideas/2026-06-27-production-logging-tracing.md)

Three sequential, independently verifiable PRs. 001 ships the tooling, 002 proves
it on the bug that motivated the work, 003 rolls it out across the rest of the
codebase. Cloudflare Workers Logs + automatic traces only — no Sentry for now.
