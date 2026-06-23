# Todo list — e2e test coverage

Tracks e2e (Playwright) tests still to be written. See `test/*.spec.ts` for the
current suite and `test/flows.ts` / `test/mailpit.ts` for shared helpers.

Format: `[status] Priority | Spec file | Description`

Priorities: `Must` · `Should` · `Nice`

> **Write discipline:** new write-tests must self-revert mutations (see the revert
> comment in `test/users.spec.ts`) or reset the DB, otherwise they cause cross-spec
> seed drift. Use the existing `login` / `goto` helpers and assert by accessible
> role/label/text, not test ids.

## Already covered

- [x] `orders.spec.ts` — regular single-account user places an order → success + notification emails (`priya`)
- [x] `accounts.spec.ts` — multi-account user selects an account from the selection page (`tom`)
- [x] `products.spec.ts` — user browse/search; admin browse/search/edit; staff read-only catalog
- [x] `users.spec.ts` — admin edits a user in the drawer (+ revert); staff read-only view
- [x] `invites.spec.ts` — full invite lifecycle: admin invites → email link → set password → dashboard

## To do

### Authorization / access-control negatives (the security boundary — highest value)

- [x] Must | `authorization.spec.ts` | A `user` (priya/olivia) navigating directly to `/manage/*` (dashboard, users, products, orders, accounts) is blocked/redirected
- [ ] Must | `authorization.spec.ts` | A `user` accessing an account they are **not** assigned to (`/accounts/$otherAccountId`) is denied by RLS
- [ ] Must | `authorization.spec.ts` | Unauthenticated access to any `_protected` route redirects to `/login`
- [ ] Should | `authorization.spec.ts` | Staff (`marcus`/`sarah`) attempting a write that should be denied fails (beyond the existing "no edit button" check)

### Order lifecycle beyond the simplest case

- [ ] Must | `orders.spec.ts` | Admin/staff placing an order **on behalf** of an account via `/manage/orders/new` (`AccountCombobox`)
- [ ] Must | `orders.spec.ts` | Template-driven order: change quantities (boxes / extra bottles) and verify totals
- [ ] Should | `orders.spec.ts` | Validation failure — submitting an order with zero items (`items.min(1)`) shows an error
- [ ] Should | `orders.spec.ts` | Open an order from the management list (`/manage/orders`) and verify its details (`/manage/orders/$orderId`)

### Auth flows (exist but untested)

- [ ] Must | `auth.spec.ts` | Forgot password → reset email → set new password (`forgot-password` + `auth/reset-password`); Mailpit harness already available
- [ ] Should | `auth.spec.ts` | Change password (`/change-password`)
- [ ] Should | `auth.spec.ts` | Login failure (wrong password) shows an error — only the success path is tested today

### Account & template management (admin)

- [ ] Should | `accounts.spec.ts` | Admin creates and edits an account (`/manage/accounts` — `createAccount` / `updateAccount`)
- [ ] Should | `accounts.spec.ts` | Admin edits an account's order template (`/manage/accounts/$accountId/template`)
- [ ] Nice | `accounts.spec.ts` | Admin assigns users to an account (`/manage/accounts/$accountId/users`)
