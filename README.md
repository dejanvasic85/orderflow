<h1 align="center">OrderFlow</h1>

<p align="center">
  A progressive web app for managing order requests at a liquor wholesaler — replacing SMS/email with a centralised, role-based system.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tooling"><strong>Tooling</strong></a> ·
  <a href="#developing-and-running-locally"><strong>Developing and Running Locally</strong></a>
</p>
<br/>

## Features

- Role-based access for admins, staff, and sales users
- Account and product catalog management
- Per-account order templates with suggested quantities
- Order request submission and history
- Email notifications on order placement
- Product image upload via Cloudflare R2 (presigned URLs, client-side WebP conversion)
- Installable as a PWA on mobile and desktop
- Type-safe development with TypeScript and Zod
- Server-side rendering with TanStack Start on Cloudflare Workers

## Tooling

- **TanStack Start**: Full-stack React framework with SSR and server functions
- **Supabase**: Postgres database, Auth, and Row Level Security
- **Tailwind CSS + shadcn/ui**: Utility-first styling with accessible component primitives
- **Cloudflare Workers**: Edge deployment and serving
- **Cloudflare R2**: Product image storage
- **Vite**: Build tooling
- **Zod**: Schema validation for environment variables and form inputs
- **Vitest**: Unit testing with jsdom and Testing Library
- **Playwright**: End-to-end testing

## Why We Built This

BWOW (Boutique Wines of the World) manages ~400–500 accounts and was handling order requests entirely over SMS and email. OrderFlow gives the team a single place to receive, track, and review requests — with account templates making repeat orders fast for sales reps.

## Developing and Running Locally

### Prerequisites

- Node.js and pnpm
- Docker (for Supabase local stack)
- Supabase CLI

### Install dependencies

```bash
pnpm install
```

### Start the local Supabase stack

```bash
supabase start
supabase db reset
```

> After every `supabase db reset`, restart the Kong container to restore its upstream connection:
>
> ```bash
> docker restart supabase_kong_orderflow
> ```

### Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values. After `supabase start`, paste the printed anon key into `.env.local`.

### Run the dev server

```bash
vp dev
```

The app runs at `http://localhost:3344`. Supabase Studio is at `http://localhost:54323`.

### Run tests

```bash
vp test          # unit tests
vp check         # lint + format + type checks
```

### Run end-to-end tests

```bash
# Requires supabase + vp dev both running
vp exec playwright test
```

## Deployment

The app is deployed to Cloudflare Workers via `wrangler`. Every push to `main` deploys to production at [https://bwow.vasic.com.au](https://bwow.vasic.com.au).

---

Built for BWOW. Feedback and contributions welcome.
