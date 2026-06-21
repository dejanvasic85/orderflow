/**
 * Fail-fast verification that every variable the manifest marks required for a context is
 * present (non-empty), before the costly steps in a workflow run. Lists *all* missing names
 * at once, with a GitHub `::error::` annotation.
 *
 * Usage:
 *   tsx deployment/verifyEnv.ts <context>              # reads SECRETS_JSON (deploy jobs)
 *   tsx deployment/verifyEnv.ts <context> --from-env   # reads process.env (e2e .env.local)
 *
 * <context> is one of the deploymentContexts in env.manifest.ts.
 */

import { deploymentContexts, requiredFor, type DeploymentContext } from "./env.manifest";
import { readSecretsJson } from "./secretsJson";

function isContext(value: string): value is DeploymentContext {
  return (deploymentContexts as readonly string[]).includes(value);
}

function resolveValues(fromEnv: boolean): Record<string, string | undefined> {
  if (fromEnv) {
    return process.env;
  }
  return readSecretsJson();
}

function main() {
  const [contextArg, ...flags] = process.argv.slice(2);
  const fromEnv = flags.includes("--from-env");

  if (!contextArg || !isContext(contextArg)) {
    console.error(
      `::error::verifyEnv: expected a context (${deploymentContexts.join(", ")}), got "${contextArg ?? ""}".`,
    );
    process.exit(1);
  }

  const values = resolveValues(fromEnv);
  const missing = requiredFor(contextArg)
    .map((spec) => spec.name)
    .filter((name) => {
      const value = values[name];
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
