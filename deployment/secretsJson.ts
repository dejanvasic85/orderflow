/** Parses the `${{ toJSON(secrets) }}` blob the workflow passes in as SECRETS_JSON. */

const secretsEnvVar = "SECRETS_JSON";

export function readSecretsJson(): Record<string, string> {
  const raw = process.env[secretsEnvVar];
  if (!raw) {
    throw new Error(
      `${secretsEnvVar} is not set. The workflow step must pass \`${secretsEnvVar}: \${{ toJSON(secrets) }}\` in its env block.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`::error::${secretsEnvVar} is not valid JSON.`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`::error::${secretsEnvVar} did not parse to an object.`);
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}
