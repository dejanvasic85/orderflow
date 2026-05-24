# Todo list

Infra and setup

- [x] Rename bww to bwow including admin email
- [x] Layout components -> Update agents.md instructions and skills for UI development
- [x] Form library and validation - replace all the use state in the UserEditPanel
- [x] Filename and module convention - what do we do about shadcn installation etc?
- [x] Unit tests
- [x] Setup deployment to cloudflare
- [x] CI Pipeline with unit tests and branch deployments
- [x] Setup the admin user
- [x] List the users by connecting to the API instead of mocks
- [x] End to end tests
- [x] Github checks for branch protection
- [ ] Setup domain name - orders.bwow.com.au (speak to Sam about access to this or should we get a new domain name?)
- [ ] SMTP server for email notifications (AWS SES — configure in Supabase dashboard, verify `vasic.com.au` for DKIM as interim sender domain)
- [ ] Email templates
- [ ] Logging and monitoring - including supabase and cloudflare. Could it all go to cloudflare logs?
- [ ] Configure production domain in Supabase and set up environment variables for production deployment. Currently https://orderflow.team-manager.workers.dev
- [ ] Configure production domain in Github Env Variables for production
- [ ] Playwright tests will need our custom container with supabase

User management Features:

- [x] Adding / inviting a new user
- [x] Auth callback route (`/auth/callback`) — handles invite/recovery links via shared verification logic (hash-token and code paths)
- [x] "Set your password" screen for first-time invitees (post-callback landing)
- [x] Should not be able to invite users with the same email
- [x] Resend invite from user list (for users who never accepted)
- [x] Admins need ability to mark users as "inactive" to prevent login without deleting their data
- [ ] Search users by email or name in the list. Simple textbox with a server side filter
- [ ] Ability to sort users
- [ ] Paging?
- [ ] Forgot password

Account management features:

- [ ] Account management
- [ ] CSV Import

Code cleanup (later):

- [ ] Hardcoded routes and api endpoints
