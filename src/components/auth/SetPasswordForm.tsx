import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const setPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetPasswordResult = { error?: string } | void;

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
          <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Setting password…" : "Set password"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
