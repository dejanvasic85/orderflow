/**
 * Single source of truth for which environment variables / secrets each CI context
 * needs, and what role each one plays. The deployment scripts (verifyEnv, syncWorkerSecrets)
 * derive everything from this — so adding a new secret is a one-line edit here instead of
 * touching every workflow file.
 *
 * NOTE: GitHub secrets can never be read at runtime by a script. Each workflow step binds
 * the specific secrets that context needs into its own env block (`NAME: ${{ secrets.NAME }}`),
 * one line per secret — GitHub flags a blanket `toJSON(secrets)` dump as a possible
 * credential-exfiltration pattern, so we never pass the whole secret bag at once. This
 * manifest is the source of truth for which names each context requires; keep each
 * workflow's env block in sync with `requiredFor(context)` / `workerSecretSpecs()` by hand.
 *
 * The app's runtime env schema lives in src/lib/config.ts (serverEnvSchema). Keep the names
 * here aligned with that schema; this file adds the CI-only metadata Zod doesn't model.
 */

export const deploymentContexts = [
  "e2e",
  "preview",
  "prod",
  "migrate",
  "cleanup",
  "smoke",
] as const;

export type DeploymentContext = (typeof deploymentContexts)[number];

/**
 * - build: consumed at build time (embedded into the client bundle, e.g. VITE_*)
 * - workerSecret: pushed to the Cloudflare Worker via `wrangler secret bulk`
 * - configVar: a non-secret worker `vars` value (lives in wrangler.jsonc in deploy; still
 *   required in process env for the e2e dev server). NEVER pushed via `secret bulk`.
 * - cli: used by a CLI step in the job (supabase/wrangler auth), never sent to the worker
 */
export type EnvRole = "build" | "workerSecret" | "configVar" | "cli";

export type EnvVarSpec = {
  name: string;
  /** Contexts in which this var is required (non-empty). */
  requiredIn: readonly DeploymentContext[];
  roles: readonly EnvRole[];
  /**
   * When syncing to the worker, the key name to write under, if it differs from `name`.
   * (Cloudflare's account id doubles as the R2 account id on the worker side.)
   */
  workerAlias?: string;
};

export const envManifest = [
  {
    name: "VITE_SUPABASE_URL",
    requiredIn: ["e2e", "preview", "prod"],
    roles: ["build"],
  },
  {
    name: "VITE_SUPABASE_ANON_KEY",
    requiredIn: ["e2e", "preview", "prod"],
    roles: ["build"],
  },
  {
    name: "VITE_SENTRY_DSN",
    // Not required in e2e: Sentry alerting has no value in local/CI test runs.
    requiredIn: ["preview", "prod"],
    roles: ["build"],
  },
  {
    name: "SUPABASE_SECRET_KEY",
    requiredIn: ["e2e", "preview", "prod"],
    roles: ["workerSecret"],
  },
  {
    name: "SITE_URL",
    requiredIn: ["e2e"],
    roles: ["configVar"],
  },
  {
    name: "MAILPIT_API_URL",
    // Routes app emails to Mailpit's HTTP send API so the order-notification e2e can
    // assert delivery. Local/e2e only — production uses SES, never this var.
    requiredIn: ["e2e"],
    roles: ["configVar"],
  },
  {
    name: "R2_ACCOUNT_ID",
    requiredIn: ["e2e"],
    // For deploy contexts, R2_ACCOUNT_ID is produced via the workerAlias on CLOUDFLARE_ACCOUNT_ID
    // below — it is NOT a separate secret. This entry exists solely to assert the dev server's
    // .env.local contains R2_ACCOUNT_ID before the e2e run.
    roles: ["configVar"],
  },
  {
    name: "R2_ACCESS_KEY_ID",
    requiredIn: ["e2e", "preview", "prod"],
    roles: ["workerSecret"],
  },
  {
    name: "R2_SECRET_ACCESS_KEY",
    requiredIn: ["e2e", "preview", "prod"],
    roles: ["workerSecret"],
  },
  {
    name: "R2_BUCKET_NAME",
    requiredIn: ["e2e"],
    // wrangler.jsonc `vars` in deploy — must not be pushed as a secret.
    roles: ["configVar"],
  },
  {
    name: "R2_PUBLIC_BASE_URL",
    requiredIn: ["e2e"],
    // wrangler.jsonc `vars` in deploy — must not be pushed as a secret.
    roles: ["configVar"],
  },
  {
    name: "AWS_ACCESS_KEY_ID",
    requiredIn: ["preview", "prod"],
    roles: ["workerSecret"],
  },
  {
    name: "AWS_SECRET_ACCESS_KEY",
    requiredIn: ["preview", "prod"],
    roles: ["workerSecret"],
  },
  {
    name: "CLOUDFLARE_API_TOKEN",
    requiredIn: ["preview", "prod", "cleanup"],
    roles: ["cli"],
  },
  {
    name: "CLOUDFLARE_ACCOUNT_ID",
    requiredIn: ["preview", "prod", "cleanup"],
    roles: ["cli", "workerSecret"],
    // The worker's R2 binding reuses the Cloudflare account id under this name.
    workerAlias: "R2_ACCOUNT_ID",
  },
  {
    name: "SUPABASE_ACCESS_TOKEN",
    requiredIn: ["prod", "migrate"],
    roles: ["cli"],
  },
  {
    name: "SUPABASE_DB_PASSWORD",
    requiredIn: ["prod", "migrate"],
    roles: ["cli"],
  },
  {
    name: "SUPABASE_PROJECT_ID",
    requiredIn: ["prod", "migrate"],
    roles: ["cli"],
  },
  {
    name: "SMOKE_SITE_URL",
    requiredIn: ["smoke"],
    roles: ["configVar"],
  },
  {
    name: "SMOKE_TEST_EMAIL",
    requiredIn: ["smoke"],
    roles: ["configVar"],
  },
  {
    name: "SMOKE_TEST_PASSWORD",
    requiredIn: ["smoke"],
    roles: ["configVar"],
  },
] as const satisfies readonly EnvVarSpec[];

export function requiredFor(context: DeploymentContext): readonly EnvVarSpec[] {
  return envManifest.filter((spec) => (spec.requiredIn as readonly string[]).includes(context));
}

/** Specs that should be written to the Cloudflare Worker via `wrangler secret bulk`. */
export function workerSecretSpecs(): readonly EnvVarSpec[] {
  return envManifest.filter((spec) => (spec.roles as readonly string[]).includes("workerSecret"));
}
