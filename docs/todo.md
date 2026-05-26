# Todo list

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
- [ ] Infra | Must | RLS policies — users see only their assigned accounts; staff read-only across all order requests
- [ ] Infra | Must | `src/lib/products/` query layer (mirror `accounts/`, `users/`)
- [ ] Feature | Must | Real product catalog browse — replace mock data on account orders page
- [ ] Feature | Must | Order draft state — add items with box + extra bottle quantities
- [ ] Feature | Must | Submit order request — server function + RLS scoped to assigned accounts
- [ ] Feature | Must | Order history view — replace mock data with real submitted orders
- [ ] Feature | Must | Wire existing "New Order" button to the order flow
- [ ] Quality | Must | Unit testing the server functions
- [ ] Quality | Must | Playwright tests improved and working locally
- [ ] Quality | Must | Playwright custom container with Supabase so it is working properly in the pipeline
- [ ] Feature | Must | PWA — manifest, service worker, install prompt, offline app shell
- [ ] Feature | Must | Notification preferences UI — users edit their own email/SMS preferences
- [ ] Feature | Must | Staff role surface — read-only view of all order requests
- [ ] Productionising | Must | Fix the publicly available view users_with_email - see email for warning from supabase
- [ ] Productionising | Must | Set up production domain (orders.bwow.com.au) — confirm access with Sam or register new
- [ ] Productionising | Must | SMTP server (AWS SES) for email notifications — configure in Supabase, verify `vasic.com.au` for DKIM as interim sender
- [ ] Productionising | Must | Email templates
- [ ] Productionising | Must | Configure production domain in Supabase (currently https://orderflow.team-manager.workers.dev)
- [ ] Productionising | Must | Configure production env vars in GitHub
- [ ] Feature | Must | Templates — per-account product list; users can add, only admins can remove
- [ ] Feature | Must | Admin places order request on behalf of an account
- [ ] Feature | Must | Per-request delivery override (note + address)
- [ ] Feature | Must | Email notification on order placed
- [ ] Feature | Must | SMS notifications (Phase 2)
- [ ] Feature | Must | MYOB CSV export — orders out of our system into MYOB
- [ ] Feature | Must | Account management UX — full CRUD, assigning users, delivery address editing
- [ ] Productionising | Must | Logging and monitoring (Supabase + Cloudflare — consider unifying in Cloudflare logs)
- [ ] Feature | Must| Search users by email or name (server-side filter)
- [ ] Feature | Must| Sort users in admin list
- [ ] Feature | Must | Paging on users list
- [ ] Feature | Must | CSV import for products and accounts (incl. MYOB import back into our system)
- [ ] Feature | Must | Change password while logged in
- [ ] Feature | Nice | Homepage dashboard — reporting / summary tiles (Phase 4, quoted separately)
- [ ] Cleanup | Nice | Remove hardcoded routes and API endpoints
- [ ] Quality | Nice | Question architecture direction and whether we are heading in the right direction - https://claude.ai/code/session_01FuB3evNxHRJvTYkVDEod2n
