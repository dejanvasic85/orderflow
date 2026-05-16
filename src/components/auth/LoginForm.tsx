import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.signInWithPassword(value);
      if (error) {
        setSubmitError(error.message ?? "Sign in failed");
        return;
      }
      await router.navigate({ to: "/dashboard" });
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
      <form.Field name="email">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <Input
              id={field.name}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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

      {submitError && <FieldError errors={[{ message: submitError }]} />}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
