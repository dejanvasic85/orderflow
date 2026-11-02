/**
 * Pushes the worker-role secrets to a Cloudflare Worker via `wrangler secret bulk`,
 * driven entirely by env.manifest.ts. Replaces the hand-maintained jq/bash payload that
 * previously lived in .github/actions/sync-worker-secrets.
 *
 * Usage:
 *   tsx deployment/syncWorkerSecrets.ts
 *   tsx deployment/syncWorkerSecrets.ts --preview <previewName> [--worker <workerName>]
 *
 * Without `--preview` this writes to the Worker's production environment. With it,
 * `wrangler preview secret bulk --name` writes to that Preview instead, and `--worker`
 * names the Worker the Preview belongs to.
 *
 * Reads each worker secret's value from process.env under its own name (the workflow step
 * populates these with explicit `NAME: ${{ secrets.NAME }}` entries); requires
 * CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID to already be in the process env for wrangler.
 */

import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { workerSecretSpecs } from "./env.manifest";

type SyncTarget = {
  previewName?: string;
  workerName?: string;
};

function buildPayload(): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const spec of workerSecretSpecs()) {
    const value = process.env[spec.name];
    if (value === undefined || value === "") {
      throw new Error(`Cannot sync worker secret "${spec.name}": missing from process env.`);
    }
    const targetKey = spec.workerAlias ?? spec.name;
    payload[targetKey] = value;
  }
  return payload;
}

function buildArgs({ previewName, workerName }: SyncTarget): string[] {
  if (previewName) {
    return [
      "exec",
      "wrangler",
      "preview",
      "secret",
      "bulk",
      "--name",
      previewName,
      ...(workerName ? ["--worker-name", workerName] : []),
    ];
  }

  return ["exec", "wrangler", "secret", "bulk", ...(workerName ? ["--name", workerName] : [])];
}

function main() {
  const { values } = parseArgs({
    options: {
      preview: { type: "string" },
      worker: { type: "string" },
    },
  });
  const payload = buildPayload();

  const result = spawnSync(
    "vp",
    buildArgs({ previewName: values.preview, workerName: values.worker }),
    {
      input: JSON.stringify(payload),
      stdio: ["pipe", "inherit", "inherit"],
      encoding: "utf-8",
    },
  );

  if (result.error) {
    console.error(`::error::Failed to spawn wrangler: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`::error::wrangler secret bulk failed (exit ${result.status ?? "unknown"}).`);
    process.exit(result.status ?? 1);
  }
}

main();
