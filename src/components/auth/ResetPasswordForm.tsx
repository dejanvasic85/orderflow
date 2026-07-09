import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { passwordSchema } from "@/lib/auth/schema";

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordResult = { error?: string } | void;

type ResetPasswordFormProps = {
  onReset: (password: string) => Promise<ResetPasswordResult>;
};

export function ResetPasswordForm({ onReset }: ResetPasswordFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const result = await onReset(value.password);
      if (result?.error) {
        setSubmitError(result.error);
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
            <FieldLabel htmlFor={field.name}>New password</FieldLabel>
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
            <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
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
            {isSubmitting ? "Resetting password…" : "Reset password"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
