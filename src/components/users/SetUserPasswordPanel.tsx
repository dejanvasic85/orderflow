import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Info, Mail } from "lucide-react";
import { useState } from "react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { setPasswordSchema } from "@/lib/auth/schema";
import { toFieldErrors } from "@/lib/forms";
import type { Result } from "@/lib/result";
import type { User } from "@/lib/users/schema";

type Props = {
  user: Pick<User, "id" | "name" | "email">;
  onSetPassword: (password: string) => Promise<Result<void, { message: string }>>;
  onSendResetEmail: () => Promise<Result<void, { message: string }>>;
  onClose: () => void;
};

export function SetUserPasswordPanel({ user, onSetPassword, onSendResetEmail, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetSending, setResetSending] = useState(false);
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

  async function handleSendResetEmail() {
    setResetSending(true);
    try {
      await onSendResetEmail();
    } finally {
      setResetSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-base font-semibold">Set password</h2>
        <p className="text-sm text-muted-foreground">
          {user.name} · {user.email}
        </p>
      </div>

      <Separator />

      <Alert>
        <Info />
        <AlertDescription>
          The user will be required to set a new password the next time they sign in.
        </AlertDescription>
      </Alert>

      {/* Option A: Send reset email */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Send a reset link</p>
          <p className="text-sm text-muted-foreground">
            Email a password reset link to {user.email}
          </p>
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={resetSending}
            onClick={handleSendResetEmail}
          >
            <Mail data-icon="inline-start" />
            {resetSending ? "Sending…" : "Send reset email"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Option B: Set temporary password directly */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Set a temporary password</p>
          <p className="text-sm text-muted-foreground">
            The user must change this password on next sign-in
          </p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="password">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="admin-new-password">New password</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="admin-new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <PasswordStrengthMeter password={field.state.value} />
                  <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                </Field>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="admin-confirm-password">Confirm password</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="admin-confirm-password"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        onClick={() => setShowConfirm((v) => !v)}
                      >
                        {showConfirm ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          {submitError && <FieldError errors={[{ message: submitError }]} />}

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Setting password…" : "Set password"}
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  );
}
