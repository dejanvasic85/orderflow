import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { setPasswordSchema } from "@/lib/auth/schema";
import type { Result } from "@/lib/result";

export type SetPasswordResult = Result<void, { message: string }>;

type SetPasswordFormProps = {
  onSetPassword: (password: string) => Promise<SetPasswordResult>;
};

export function SetPasswordForm({ onSetPassword }: SetPasswordFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: setPasswordSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const result = await onSetPassword(value.password);
      if (!result.ok) {
        setSubmitError(result.error.message);
      }
    },
  });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="password">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
            <Input
              id={field.name}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <PasswordStrengthMeter password={field.state.value} />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="confirmPassword">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
            <Input
              id={field.name}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      {submitError && <FieldError errors={[{ message: submitError }]} />}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" className="mt-1 w-full" loading={isSubmitting}>
            {isSubmitting ? "Setting password…" : "Set password"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
