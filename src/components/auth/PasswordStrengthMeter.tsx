import { Check, X } from "lucide-react";
import {
  evaluatePassword,
  type PasswordStrengthLabel,
  passwordRequirementsValue,
  type PasswordRequirementKey,
} from "@/lib/auth/passwordStrength";
import { cn } from "@/lib/utils";

const segmentCount = 4;

const strengthStylesValue: Record<PasswordStrengthLabel, { segment: string; text: string }> = {
  Weak: { segment: "bg-destructive", text: "text-destructive" },
  Fair: { segment: "bg-amber-600", text: "text-amber-600" },
  Good: { segment: "bg-blue-600", text: "text-blue-600" },
  Strong: { segment: "bg-emerald-600", text: "text-emerald-600" },
};

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Object.keys widens to string[]; keys are guaranteed by passwordRequirementsValue's own shape
const requirementOrder = Object.keys(passwordRequirementsValue) as PasswordRequirementKey[];

type PasswordStrengthMeterProps = {
  password: string;
  className?: string;
};

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const { score, label, met } = evaluatePassword(password);
  const styles = label ? strengthStylesValue[label] : null;

  return (
    <div className={cn("flex flex-col gap-2", className)} aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: segmentCount }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              styles && index < score ? styles.segment : "bg-muted",
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        {label && <span className={cn("font-medium", styles?.text)}>{label}</span>}
      </div>

      <ul className="flex flex-col gap-1">
        {requirementOrder.map((key) => {
          const requirement = passwordRequirementsValue[key];
          const satisfied = met[key];
          return (
            <li
              key={key}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                satisfied ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {satisfied ? (
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <X className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                <span className="sr-only">{satisfied ? "Met: " : "Not met: "}</span>
                {requirement.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
