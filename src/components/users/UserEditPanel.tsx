import { useForm } from "@tanstack/react-form";
import { Check, Copy } from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
import { roleInfoValue } from "@/components/users/roleInfo";
import { RoleInfoDisclosure } from "@/components/users/RoleInfoDisclosure";
import { UserAccountsSection } from "@/components/users/UserAccountsSection";
import { toFieldErrors } from "@/lib/forms";
import { isUserRole, type UpdateUserAccountsInput, type User, userRoles } from "@/lib/users/schema";

type BaseProps = {
  onSave: (updated: User, accountsPayload?: UpdateUserAccountsInput) => void | Promise<void>;
  onDiscard: () => void;
  onCheckEmailExists?: (email: string) => Promise<boolean>;
  onResendInvite?: () => Promise<void>;
  allAccounts?: { id: string; name: string }[];
  readOnly?: boolean;
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

const blankUser: User = {
  id: "",
  name: "",
  email: "",
  phone: null,
  active: true,
  inviteAcceptedAt: null,
  invitedAt: null,
  role: "user",
  notificationPreferences: { email: true, sms: false },
  createdAt: "",
  updatedAt: "",
  accounts: [],
};

export function UserEditPanel(props: Props) {
  const { onSave, onDiscard, onCheckEmailExists, onResendInvite, allAccounts, readOnly } = props;
  const mode = props.mode ?? "edit";
  const isCreate = mode === "create";
  const user = props.user ?? blankUser;
  const nameParts = user.name.split(" ");
  const accountsPayloadRef = useRef<UpdateUserAccountsInput | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const handleAccountsChange = useCallback((payload: UpdateUserAccountsInput) => {
    accountsPayloadRef.current = payload;
  }, []);
  const form = useForm({
    defaultValues: {
      email: user.email,
      firstName: nameParts[0] ?? "",
      lastName: nameParts.slice(1).join(" "),
      phone: user.phone ?? "",
      role: user.role,
      notifications: {
        email: user.notificationPreferences.email,
        sms: user.notificationPreferences.sms,
      },
      active: user.active,
    },
    validators: { onSubmit: userEditSchema },
    onSubmit: async ({ value }) => {
      const updatedUser: User = {
        ...user,
        email: value.email,
        name: [value.firstName, value.lastName].filter(Boolean).join(" "),
        phone: value.phone || null,
        role: value.role,
        active: value.active,
        notificationPreferences: {
          email: value.notifications.email,
          sms: value.notifications.sms,
        },
      };
      const accountsPayload = accountsPayloadRef.current;
      await onSave(updatedUser, accountsPayload ?? undefined);
      if (!isCreate) toast.success("Changes saved");
    },
  });

  const headerTitle = isCreate ? "Invite new user" : user.name;
  const headerSubtitle = isCreate ? "They'll receive an email to set their password" : user.email;
  const submitLabel = isCreate ? "Send invite" : "Save changes";
  const isPending = !isCreate && user.active && !user.inviteAcceptedAt;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-base font-semibold">{headerTitle}</h2>
        <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
      </div>

      <Separator />

      {isPending && onResendInvite && user.invitedAt && (
        <>
          <PendingInviteSection invitedAt={user.invitedAt} onResend={onResendInvite} />
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={!isCreate || readOnly}
                />
                {!isCreate && (
                  <button
                    type="button"
                    aria-label="Copy email"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      void navigator.clipboard.writeText(field.state.value).then(() => {
                        setEmailCopied(true);
                        setTimeout(() => setEmailCopied(false), 2000);
                      });
                    }}
                  >
                    {emailCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
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
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground">Australian mobile numbers only.</p>
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
                onValueChange={(v) => {
                  if (isUserRole(v)) field.handleChange(v);
                }}
                disabled={readOnly}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {userRoles.map((role) => (
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
              <RoleInfoDisclosure />
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                      disabled={readOnly}
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

        {!isCreate && user.role === "user" && allAccounts && (
          <>
            <Separator />
            <UserAccountsSection
              userId={user.id}
              initialAccounts={user.accounts}
              allAccounts={allAccounts}
              onChange={handleAccountsChange}
            />
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!readOnly && (
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" loading={isSubmitting}>
                  {isSubmitting ? (isCreate ? "Sending invite…" : "Saving…") : submitLabel}
                </Button>
              )}
            </form.Subscribe>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset();
              onDiscard();
            }}
          >
            {readOnly ? "Close" : "Discard"}
          </Button>
        </div>
      </form>
    </div>
  );
}
