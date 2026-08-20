/**
 * Source of truth for which env vars/secrets each CI context needs.
 * Keep names aligned with serverEnvSchema in src/lib/config.ts.
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

/** build: client bundle (VITE_*). workerSecret: `wrangler secret bulk`. configVar: non-secret wrangler.jsonc `vars`. cli: CLI auth step, never sent to worker. */
export type EnvRole = "build" | "workerSecret" | "configVar" | "cli";

export type EnvVarSpec = {
  name: string;
  requiredIn: readonly DeploymentContext[];
  roles: readonly EnvRole[];
  /** Key name to sync to the worker under, if different from `name`. */
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
    requiredIn: ["e2e"],
    roles: ["configVar"],
  },
  {
    name: "R2_ACCOUNT_ID",
    // Deploy contexts derive this via CLOUDFLARE_ACCOUNT_ID's workerAlias instead.
    requiredIn: ["e2e"],
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
    roles: ["configVar"],
  },
  {
    name: "R2_PUBLIC_BASE_URL",
    requiredIn: ["e2e"],
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

export function workerSecretSpecs(): readonly EnvVarSpec[] {
  return envManifest.filter((spec) => (spec.roles as readonly string[]).includes("workerSecret"));
}
