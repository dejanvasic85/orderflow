import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { PendingInviteSection } from "@/components/users/PendingInviteSection";
import { type User, userRoles } from "@/lib/users/schema";

type BaseProps = {
  onSave: (updated: User) => void;
  onDiscard: () => void;
  onCheckEmailExists?: (email: string) => Promise<boolean>;
  onResendInvite?: () => Promise<void>;
};

type Props =
  | (BaseProps & { mode: "create"; user?: User })
  | (BaseProps & { mode?: "edit"; user: User });

const userEditSchema = z.object({
  email: z.email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .refine(
      (v) => v === "" || /^04\d{8}$/.test(v),
      "Mobile number must be 10 digits starting with 04",
    ),
  role: z.enum(userRoles),
  notifications: z.object({ email: z.boolean(), sms: z.boolean() }),
  active: z.boolean(),
});

type UserEditValues = z.infer<typeof userEditSchema>;

const blankUser: User = {
  id: "",
  name: "",
  email: "",
  phone: null,
  active: true,
  invite_accepted_at: null,
  invited_at: null,
  role: "user",
  notification_preferences: { email: true, sms: false },
  created_at: "",
  updated_at: "",
  accounts: [],
};

function toFieldErrors(errors: unknown[]): { message?: string }[] {
  return errors.map((e) => ({
    message: typeof e === "string" ? e : (e as { message?: string })?.message,
  }));
}

export function UserEditPanel(props: Props) {
  const { onSave, onDiscard, onCheckEmailExists, onResendInvite } = props;
  const mode = props.mode ?? "edit";
  const isCreate = mode === "create";
  const user = props.user ?? blankUser;
  const nameParts = user.name.split(" ");
  const form = useForm({
    defaultValues: {
      email: user.email,
      firstName: nameParts[0] ?? "",
      lastName: nameParts.slice(1).join(" "),
      phone: user.phone ?? "",
      role: user.role,
      notifications: {
        email: user.notification_preferences.email,
        sms: user.notification_preferences.sms,
      },
      active: user.active,
    },
    validators: { onSubmit: userEditSchema },
    onSubmit: ({ value }) => {
      onSave({
        ...user,
        email: value.email,
        name: [value.firstName, value.lastName].filter(Boolean).join(" "),
        phone: value.phone || null,
        role: value.role,
        active: value.active,
        notification_preferences: {
          email: value.notifications.email,
          sms: value.notifications.sms,
        },
      });
      if (!isCreate) toast.success("Changes saved");
    },
  });

  const headerTitle = isCreate ? "Invite new user" : user.name;
  const headerSubtitle = isCreate ? "They'll receive an email to set their password" : user.email;
  const submitLabel = isCreate ? "Send invite" : "Save changes";
  const isPending = !isCreate && user.active && !user.invite_accepted_at;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-base font-semibold">{headerTitle}</h2>
        <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
      </div>

      <Separator />

      {isPending && onResendInvite && user.invited_at && (
        <>
          <PendingInviteSection invitedAt={user.invited_at} onResend={onResendInvite} />
          <Separator />
        </>
      )}

      {/* Basic fields */}
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
                <FieldLabel htmlFor="first-name">First name</FieldLabel>
                <Input
                  id="first-name"
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
                <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                <Input
                  id="last-name"
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
              if (isCreate && onCheckEmailExists) {
                try {
                  const exists = await onCheckEmailExists(value);
                  if (exists) return "A user with this email already exists";
                } catch {
                  return "Unable to verify this email right now. Please try again.";
                }
              }
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={!isCreate}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="phone">Mobile number</FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="04xxxxxxxx"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Field name="role">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as UserEditValues["role"])}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <Separator />

        {/* Notification preferences */}
        <div className="flex flex-col gap-3">
          <Label>Notification preferences</Label>

          <form.Field name="notifications.email">
            {(field) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notif-email"
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(!!v)}
                />
                <Label htmlFor="notif-email" className="font-normal">
                  Email notifications
                </Label>
              </div>
            )}
          </form.Field>

          <form.Field name="notifications.sms">
            {(field) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notif-sms"
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(!!v)}
                />
                <Label htmlFor="notif-sms" className="font-normal">
                  SMS notifications
                </Label>
              </div>
            )}
          </form.Field>
        </div>

        {!isCreate && (
          <>
            <Separator />

            {/* Account access */}
            <form.Field name="active">
              {(field) => (
                <div className="flex flex-col gap-3">
                  <Label>Account access</Label>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="active"
                      checked={field.state.value}
                      onCheckedChange={(v) => field.handleChange(v)}
                    />
                    <Label htmlFor="active" className="font-normal">
                      Active
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Inactive users cannot log in. Their current session will remain active until it
                    expires.
                  </p>
                </div>
              )}
            </form.Field>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button type="submit">{submitLabel}</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset();
              onDiscard();
            }}
          >
            Discard
          </Button>
        </div>
      </form>
    </div>
  );
}
