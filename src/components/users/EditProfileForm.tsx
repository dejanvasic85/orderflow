import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Result } from "@/lib/result";
import type { UpdateOwnProfileInput } from "@/lib/users/schema";

const editProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string(),
  phone: z
    .string()
    .refine(
      (v) => v === "" || /^04\d{8}$/.test(v),
      "Mobile number must be 10 digits starting with 04",
    ),
  notifications: z.object({ email: z.boolean(), sms: z.boolean() }),
});

export type EditProfileFormDefaults = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notifications: { email: boolean; sms: boolean };
};

type EditProfileFormProps = {
  defaultValues: EditProfileFormDefaults;
  onSave: (input: UpdateOwnProfileInput) => Promise<Result<void, { message: string }>>;
};

export function EditProfileForm({ defaultValues, onSave }: EditProfileFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      firstName: defaultValues.firstName,
      lastName: defaultValues.lastName,
      phone: defaultValues.phone,
      notifications: defaultValues.notifications,
    },
    validators: { onSubmit: editProfileSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setSubmitSuccess(false);
      const name = [value.firstName, value.lastName].filter(Boolean).join(" ");
      const result = await onSave({
        name,
        phone: value.phone || null,
        notificationPreferences: value.notifications,
      });
      if (!result.ok) {
        setSubmitError(result.error.message);
        return;
      }
      setSubmitSuccess(true);
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
      <div className="flex gap-3">
        <form.Field name="firstName">
          {(field) => (
            <Field className="flex-1">
              <FieldLabel htmlFor={field.name}>First name</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <Field className="flex-1">
              <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>
      </div>

      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" type="email" value={defaultValues.email} disabled readOnly />
        <p className="text-xs text-muted-foreground">Contact an admin to change your email.</p>
      </Field>

      <form.Field name="phone">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Contact number</FieldLabel>
            <Input
              id={field.name}
              type="tel"
              placeholder="04xxxxxxxx"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <p className="text-xs text-muted-foreground">Australian mobile numbers only.</p>
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <div className="flex flex-col gap-3">
        <Label>Notification preferences</Label>

        <form.Field name="notifications.email">
          {(field) => (
            <div className="flex items-center gap-3">
              <Switch
                id="notif-email"
                checked={field.state.value}
                onCheckedChange={(v) => field.handleChange(v)}
              />
              <Label htmlFor="notif-email" className="font-normal">
                Email notifications
              </Label>
            </div>
          )}
        </form.Field>

        <form.Field name="notifications.sms">
          {(field) => (
            <div className="flex items-center gap-3">
              <Switch
                id="notif-sms"
                checked={field.state.value}
                onCheckedChange={(v) => field.handleChange(v)}
              />
              <Label htmlFor="notif-sms" className="font-normal">
                SMS notifications
              </Label>
            </div>
          )}
        </form.Field>
      </div>

      {submitError && <FieldError errors={[{ message: submitError }]} />}
      {submitSuccess && (
        <p className="text-sm text-muted-foreground">Details updated successfully.</p>
      )}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save details"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
