import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Info, RefreshCw } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { CopyButton } from "@/components/CopyButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { roleInfoValue } from "@/components/users/roleInfo";
import { RoleInfoDisclosure } from "@/components/users/RoleInfoDisclosure";
import { generatePassword } from "@/lib/auth/generatePassword";
import { passwordSchema } from "@/lib/auth/schema";
import { toFieldErrors } from "@/lib/forms";
import type { Result } from "@/lib/result";
import {
  creatableUserRoles,
  type CreateUserWithPasswordInput,
  isCreatableUserRole,
} from "@/lib/users/schema";

type Props = {
  onCreate: (input: CreateUserWithPasswordInput) => Promise<Result<void, { message: string }>>;
  onCheckEmailExists: (email: string) => Promise<boolean>;
  onClose: () => void;
};

const createUserWithPasswordFormSchema = z.object({
  email: z.email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .refine(
      (v) => v === "" || /^04\d{8}$/.test(v),
      "Mobile number must be 10 digits starting with 04",
    ),
  role: z.enum(creatableUserRoles),
  password: passwordSchema,
  notifications: z.object({ email: z.boolean(), sms: z.boolean() }),
});

type CreateUserWithPasswordFormValues = z.infer<typeof createUserWithPasswordFormSchema>;

const defaultFormValues: CreateUserWithPasswordFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "user",
  password: "",
  notifications: { email: true, sms: false },
};

type Created = { email: string; password: string };

export function CreateUserWithPasswordPanel({ onCreate, onCheckEmailExists, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  const form = useForm({
    defaultValues: defaultFormValues,
    validators: { onSubmit: createUserWithPasswordFormSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const result = await onCreate({
        email: value.email,
        name: [value.firstName, value.lastName].filter(Boolean).join(" "),
        phone: value.phone || null,
        role: value.role,
        password: value.password,
        notificationPreferences: value.notifications,
        accountIds: [],
      });
      if (result.ok) {
        setCreated({ email: value.email, password: value.password });
      } else {
        setSubmitError(result.error.message);
      }
    },
  });

  if (created) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-base font-semibold">User created</h2>
          <p className="text-sm text-muted-foreground">
            They can sign in with these details right now. No email was sent.
          </p>
        </div>

        <Separator />

        <Alert>
          <Info />
          <AlertDescription>
            This is the only time the password is shown. Pass it on by phone or in person, then
            close this panel.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="created-email">Email</FieldLabel>
            <div className="flex items-center gap-2">
              <Input id="created-email" readOnly value={created.email} />
              <CopyButton value={created.email} label="Copy email" />
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="created-password">Password</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="created-password"
                readOnly
                className="font-mono"
                value={created.password}
              />
              <CopyButton value={created.password} label="Copy password" />
            </div>
          </Field>
        </div>

        <div>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-base font-semibold">New user with password</h2>
        <p className="text-sm text-muted-foreground">
          Creates the account and sets its password now. No invite email is sent.
        </p>
      </div>

      <Separator />

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <form.Field name="firstName">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="pw-first-name">First name</FieldLabel>
                <Input
                  id="pw-first-name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="pw-last-name">Last name</FieldLabel>
                <Input
                  id="pw-last-name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field
          name="email"
          validators={{
            onSubmitAsync: async ({ value }) => {
              try {
                const exists = await onCheckEmailExists(value);
                if (exists) return "A user with this email already exists";
              } catch {
                return "Unable to verify this email right now. Please try again.";
              }
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="pw-email">Email</FieldLabel>
              <Input
                id="pw-email"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="pw-phone">Mobile number</FieldLabel>
              <Input
                id="pw-phone"
                type="tel"
                placeholder="04xxxxxxxx"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <p className="text-xs text-muted-foreground">Australian mobile numbers only.</p>
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Field name="role">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="pw-role">Role</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => {
                  if (isCreatableUserRole(v)) field.handleChange(v);
                }}
              >
                <SelectTrigger id="pw-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {creatableUserRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleInfoValue[role].label}
                        <span className="text-muted-foreground">
                          &mdash; {roleInfoValue[role].summary}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <RoleInfoDisclosure roles={creatableUserRoles} />
            </Field>
          )}
        </form.Field>

        <Separator />

        <form.Field name="password">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="pw-password">Password</FieldLabel>
              <div className="flex items-center gap-2">
                <InputGroup>
                  <InputGroupInput
                    id="pw-password"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    field.handleChange(generatePassword());
                    setShowPassword(true);
                  }}
                >
                  <RefreshCw />
                  Generate
                </Button>
              </div>
              <PasswordStrengthMeter password={field.state.value} />
              <p className="text-xs text-muted-foreground">
                The user keeps this password until they change it themselves.
              </p>
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <Separator />

        <div className="flex flex-col gap-3">
          <Label>Notification preferences</Label>

          <form.Field name="notifications.email">
            {(field) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pw-notif-email"
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(!!v)}
                />
                <Label htmlFor="pw-notif-email" className="font-normal">
                  Email notifications
                </Label>
              </div>
            )}
          </form.Field>

          <form.Field name="notifications.sms">
            {(field) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pw-notif-sms"
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(!!v)}
                />
                <Label htmlFor="pw-notif-sms" className="font-normal">
                  SMS notifications
                </Label>
              </div>
            )}
          </form.Field>
        </div>

        {submitError && <FieldError errors={[{ message: submitError }]} />}

        <Separator />

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <div className="flex items-center gap-2">
              <Button type="submit" loading={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create user"}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Discard
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
