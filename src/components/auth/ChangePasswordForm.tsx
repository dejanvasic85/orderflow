import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Result } from "@/lib/result";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password different from your current one",
    path: ["newPassword"],
  });

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResult = Result<void, { message: string }>;

type ChangePasswordFormProps = {
  onChangePassword: (input: ChangePasswordInput) => Promise<ChangePasswordResult>;
};

export function ChangePasswordForm({ onChangePassword }: ChangePasswordFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validators: { onSubmit: changePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      setSubmitError(null);
      setSubmitSuccess(false);
      const result = await onChangePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      });
      if (!result.ok) {
        setSubmitError(result.error.message);
        return;
      }
      setSubmitSuccess(true);
      formApi.reset();
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
      <form.Field name="currentPassword">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
            <Input
              id={field.name}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="newPassword">
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
      {submitSuccess && <p className="text-sm text-muted-foreground">Password changed.</p>}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Changing password…" : "Change password"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
