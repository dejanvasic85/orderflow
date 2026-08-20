/**
 * Fail-fast verification that every variable the manifest marks required for a context is
 * present (non-empty), before the costly steps in a workflow run. Lists *all* missing names
 * at once, with a GitHub `::error::` annotation.
 *
 * Usage:
 *   tsx deployment/verifyEnv.ts <context>
 *
 * <context> is one of the deploymentContexts in env.manifest.ts. Reads process.env, which
 * the workflow step populates with explicit `NAME: ${{ secrets.NAME }}` entries (or, for
 * e2e/smoke, an .env.local already loaded into the job).
 */

import { deploymentContexts, requiredFor, type DeploymentContext } from "./env.manifest";

function isContext(value: string): value is DeploymentContext {
  return (deploymentContexts as readonly string[]).includes(value);
}

function main() {
  const [contextArg] = process.argv.slice(2);

  if (!contextArg || !isContext(contextArg)) {
    console.error(
      `::error::verifyEnv: expected a context (${deploymentContexts.join(", ")}), got "${contextArg ?? ""}".`,
    );
    process.exit(1);
  }

  const missing = requiredFor(contextArg)
    .map((spec) => spec.name)
    .filter((name) => {
      const value = process.env[name];
      return value === undefined || value === "";
    });

  if (missing.length > 0) {
    console.error(
      `::error::Missing required environment variables for "${contextArg}": ${missing.join(" ")}`,
    );
    process.exit(1);
  }

  console.log(`All required environment variables for "${contextArg}" are present.`);
}

main();
