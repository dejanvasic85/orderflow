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
- [ ] End to end tests
- [ ] Github checks for branch protection
- [ ] Setup domain name
- [ ] Register custom_access_token_hook in Supabase production dashboard (Authentication → Hooks) — function is deployed via migration but hook must be manually enabled in prod
- [ ] SMTP server for email notifications
- [ ] Email templates
- [ ] Logging and monitoring - including supabase and cloudflare. Could it all go to cloudflare logs?

Features:

- [ ] Adding / inviting a new user. How should this work?
- [ ] Account management
- [ ] CSV Import
