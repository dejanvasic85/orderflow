# Todo list - MVP

Format: `[status] Category | Priority | Description`

Categories: `Productionising` · `Feature` · `Infra` · `Quality` · `Cleanup`
Priorities: `Must` · `Should` · `Nice`

- [x] Infra | Must | Rename bww to bwow including admin email
- [x] Infra | Must | Layout components — update agents.md instructions and skills for UI development
- [x] Infra | Must | Form library and validation — replace all useState in UserEditPanel
- [x] Infra | Must | Filename and module convention (incl. shadcn installation)
- [x] Quality | Must | Unit tests
- [x] Productionising | Must | Setup deployment to Cloudflare
- [x] Quality | Must | CI pipeline with unit tests and branch deployments
- [x] Feature | Must | Setup the admin user
- [x] Feature | Must | List users by connecting to the API instead of mocks
- [x] Quality | Should | End-to-end tests
- [x] Quality | Must | GitHub checks for branch protection
- [x] Feature | Must | Adding / inviting a new user
- [x] Feature | Must | Auth callback route (`/auth/callback`) — invite/recovery via hash-token and code paths
- [x] Feature | Must | "Set your password" screen for first-time invitees
- [x] Feature | Must | Block inviting users with the same email
- [x] Feature | Must | Resend invite from user list
- [x] Feature | Must | Mark users as "inactive" to prevent login without deleting data
- [x] Feature | Must | Forgot password
- [x] Quality | Must | Improve the error handling to use Result system - investigate neverthrow
- [x] Quality | Must | Structure of server functions and loaders. Where should they live? We have inconsistency including testing.
- [x] Infra | Must | Migration for `products`, `order_requests`, `order_request_items`
- [x] Infra | Must | Seed data — sample product catalog in `supabase/seed.sql`
- [x] Infra | Must | Supabase Storage bucket for product images + upload UI (sort out sourcing wine/beer/liquor images for dev seed)
- [x] Infra | Must | RLS policies — users see only their assigned accounts; staff read-only across all order requests
- [x] Infra | Must | `src/lib/products/` query layer (mirror `accounts/`, `users/`)
- [x] Feature | Must | User homepage — account selection for users with multiple accounts
- [x] Feature | Must | Submit order request — server function + RLS scoped to assigned accounts
- [x] Feature | Must | Account management for admin - basic details
- [x] Feature | Must | Account management for admin - assigning and removing users
- [x] Feature | Must | Real product catalog browse — replace mock data on account orders page
- [x] Feature | Must | Order draft state — add items with box + extra bottle quantities
- [x] Feature | Must | Order history view
- [x] Feature | Must | Wire existing "New Order" button to the order flow
- [x] Feature | Must | View order details - readonly page with details of the bottles, boxes, quantities date + who ordered
- [x] Feature | Must | New order by staff and admins on behalf of accounts
- [x] Feature | Must | Manage template for Accounts in a new dedicated page
- [x] Feature | Must | Manage users for Accounts in a new dedicated page
- [x] Feature | Must | Manage accounts for users in the user drawer
- [ ] Feature | Must | Invite for staff and admin should work seamlessly - at the moment only users have been tested!
- [x] Feature | Must | Email notification on order placed
- [x] Feature | Must | SMS notifications (Phase 2)
- [x] Feature | Must| Search users by email or name (server-side filter)
- [x] Feature | Must | Paging on users list
- [ ] Feature | Must | Change password while logged in
- [ ] Feature | Must | CSV import for products and accounts (incl. MYOB import back into our system)
- [ ] Feature | Must | MYOB CSV export — orders out of our system into MYOB
- [ ] Quality | Must | Unit testing the server functions
- [ ] Quality | Must | Playwright tests improved and working locally
- [ ] Quality | Must | Playwright custom container with Supabase so it is working properly in the pipeline
- [ ] Feature | Must | PWA — manifest, service worker, install prompt, offline app shell
- [ ] Feature | Must | Notification preferences UI — users edit their own email/SMS preferences
- [ ] Feature | Must | Staff role surface — read-only view of all order requests
- [ ] Productionising | Must | Fix the publicly available view users_with_email - see email for warning from supabase
- [ ] Productionising | Must | Set up production domain (orders.bwow.com.au) — confirm access with Sam or register new
- [ ] Productionising | Must | SMTP server (AWS SES) for email notifications — configure in Supabase, verify `vasic.com.au` for DKIM as interim
- [ ] Productionising | Must | Email templates
- [ ] Productionising | Must | Configure production domain in Supabase (currently https://orderflow.team-manager.workers.dev)
- [ ] Productionising | Must | Configure production env vars in GitHub
- [ ] Productionising | Must | Logging and monitoring (Supabase + Cloudflare — consider unifying in Cloudflare logs) sender
- [ ] Feature | Nice | Homepage dashboard — reporting / summary tiles (Phase 4, quoted separately)
- [ ] Cleanup | Nice | Remove hardcoded routes and API endpoints
- [ ] Quality | Nice | Question architecture direction and whether we are heading in the right direction - https://claude.ai/code/session_01FuB3evNxHRJvTYkVDEod2n

---

## Code Cleanup

- [ ] We need a much better and cleaner pattern for Authz

- [ ] The .server.ts files have too much logic in them or all database operations should be somewhere else

- [ ] Replace all the deprecated API's like `inputValidator` on the tanstack lib

- [ ] Cleanup | Casting and typescript needs general cleanup

```ts
const { user } = Route.useRouteContext() as { user: { user_role?: string } };
```

- [ ] Cleanup | Improve the code pattern around fetching and checking result

```ts
const existingResult = await fetchTemplateForAccount(data.account_id);
if (!existingResult.ok) return existingResult;
```

- [ ] Cleanup | Page loaders are could be improved with this pattern of reading and throwing:

```ts
if (!accountResult.ok) throw new Error(accountResult.error.message);
if (!accountResult.value) throw notFound();
if (!templateResult.ok) throw new Error(templateResult.error.message);
if (!productsResult.ok) throw new Error(productsResult.error.message);
```

- [ ] Audit all the variable naming so they are camelCased
