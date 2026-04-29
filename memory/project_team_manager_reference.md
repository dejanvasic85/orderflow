---
name: team-manager reference repo
description: Tech stack, architecture, and domain model of the team-manager repo that orderflow should replicate
type: project
---

The `../team-manager` repository is a TanStack Start (Vite+) full-stack app that orderflow should replicate in structure and style.

**Why:** It's an established reference implementation that already has auth, DB, routing, and styling patterns the user wants to reuse.

**How to apply:** Mirror the same file layout, tooling choices, and patterns when building out orderflow.

## Tech Stack
- Framework: TanStack Start (`@tanstack/react-start`) with Vite Plus (`vite-plus`)
- Hosting: Cloudflare Workers (`wrangler.jsonc`)
- Database: Neon Postgres via `drizzle-orm/neon-http`
- ORM: Drizzle ORM + `drizzle-kit` for migrations
- Auth: Better Auth (`better-auth`) with email/password + `tanstackStartCookies` plugin
- Styling: Tailwind CSS v4 + `@tailwindcss/vite` + custom CSS design tokens
- Data fetching: TanStack Query + TanStack Router SSR Query
- Package manager: pnpm
- Testing: Vitest + Testing Library + jsdom
- Monitoring: Sentry (`@sentry/tanstackstart-react`)
- Forms: TanStack Form
- Icons: lucide-react

## Key File Structure
```
src/
  db/
    index.ts          # drizzle(process.env.DATABASE_URL!, { schema })
    schema.ts         # pg tables: teams, players, playerContacts, playerSkills
  lib/
    auth.ts           # betterAuth({ emailAndPassword, plugins: [tanstackStartCookies()] })
    auth-client.ts    # createAuthClient()
    authFunctions.ts  # getSession / ensureSession server fns
    teamFunctions.ts  # getTeams / createTeam server fns
    teamValidation.ts # zod schemas
  routes/
    __root.tsx        # createRootRouteWithContext, RootDocument with theme init script
    _protected.tsx    # layout route: beforeLoad checks session, redirects to /login
    _protected/
      dashboard.tsx   # loader + page component
    api/auth/$.ts     # Better Auth API handler
    index.tsx         # landing/home page
    login.tsx         # login page with beforeLoad redirect if session exists
    signup.tsx        # signup page
  components/
    Header.tsx
    Footer.tsx
    ThemeToggle.tsx   # light/dark/auto toggle stored in localStorage
  integrations/
    better-auth/header-user.tsx
    tanstack-query/devtools.tsx
    tanstack-query/root-provider.tsx
  styles.css          # Tailwind v4 + CSS custom properties design system
  router.tsx
```

## Design System
- Green-tinted "sea" palette with CSS custom properties
- Light/dark mode via `data-theme` attribute + `@media prefers-color-scheme`
- Theme init inline script in `<head>` prevents flash
- CSS classes: `.island-shell`, `.button-cta`, `.button-ghost`, `.button-neutral`, `.island-kicker`, `.nav-link`, `.page-wrap`, `.chip-shell`, `.rise-in`
- Font: Outfit from Google Fonts

## Auth Pattern
- Server fns: `getSession` / `ensureSession` (throw Error("Unauthorized") if no session)
- Protected routes via `_protected.tsx` layout with `beforeLoad` redirect
- Client-side: `authClient.signIn.email(...)` / `authClient.signUp.email(...)` / `authClient.signOut()`

## DB Pattern
- `createServerFn({ method: "GET"|"POST" })` for server functions
- `.inputValidator(zodSchema.parse)` for POST server fns
- Auth table managed by Better Auth separately (not in schema.ts)

## Build / Config
- `vite.config.ts` uses `defineConfig` from `vite-plus`, includes cloudflare plugin, tailwindcss, tanstackStart, viteReact
- `drizzle.config.ts` reads `DATABASE_URL` from env, outputs to `./drizzle/`, dialect postgresql
- `package.json` imports alias: `"#/*": "./src/*"`
- Scripts: dev, build, preview, test, deploy (wrangler), db:generate/migrate/push/pull/studio
