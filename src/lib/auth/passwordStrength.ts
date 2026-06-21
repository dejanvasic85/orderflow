export const minPasswordLength = 8;
const strongPasswordLength = 12;
const maxScore = 4;

export const passwordRequirementsValue = {
  minLength: {
    label: `At least ${minPasswordLength} characters`,
    test: (password: string) => password.length >= minPasswordLength,
  },
  lowercase: {
    label: "A lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  uppercase: {
    label: "An uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  number: {
    label: "A number",
    test: (password: string) => /[0-9]/.test(password),
  },
} as const;

export type PasswordRequirementKey = keyof typeof passwordRequirementsValue;

const requirementKeys = Object.keys(passwordRequirementsValue) as PasswordRequirementKey[];

const hasSymbol = (password: string) => /[^a-zA-Z0-9]/.test(password);

export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export type PasswordEvaluation = {
  score: number;
  label: PasswordStrengthLabel | null;
  met: Record<PasswordRequirementKey, boolean>;
  meetsRequirements: boolean;
};

const scoreLabelsValue: Record<number, PasswordStrengthLabel> = {
  0: "Weak",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

function scoreFor(password: string): number {
  const points = [
    password.length >= minPasswordLength,
    password.length >= strongPasswordLength,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[0-9]/.test(password),
    hasSymbol(password),
  ].filter(Boolean).length;

  return Math.min(points, maxScore);
}

export function evaluatePassword(password: string): PasswordEvaluation {
  const met = requirementKeys.reduce(
    (acc, key) => {
      acc[key] = passwordRequirementsValue[key].test(password);
      return acc;
    },
    {} as Record<PasswordRequirementKey, boolean>,
  );

  const meetsRequirements = requirementKeys.every((key) => met[key]);

  if (password.length === 0) {
    return { score: 0, label: null, met, meetsRequirements };
  }

  const score = scoreFor(password);

  return { score, label: scoreLabelsValue[score], met, meetsRequirements };
}
