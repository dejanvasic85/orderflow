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

User management Features:

- [ ] Adding / inviting a new user
- [ ] Auth callback route (`/auth/callback`) to handle invite/recovery links — calls `exchangeCodeForSession` then redirects
- [ ] "Set your password" screen for first-time invitees (post-callback landing)
- [ ] Resend invite from user list (for users who never accepted)
- [ ] Search users by email or name in the list. Simple textbox with a server side filter

Account management features:

- [ ] Account management
- [ ] CSV Import
