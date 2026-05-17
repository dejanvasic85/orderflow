import { useForm } from "@tanstack/react-form";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
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
import { type User, type UserAccount, userRoles } from "@/lib/users/schema";

type Mode = "edit" | "create";

type Props = {
  mode?: Mode;
  user?: User;
  availableAccounts: UserAccount[];
  onSave: (updated: User) => void;
  onDiscard: () => void;
};

const userEditSchema = z.object({
  email: z.email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(userRoles),
  accounts: z.array(z.object({ id: z.string(), name: z.string() })),
  notifications: z.object({ email: z.boolean(), sms: z.boolean() }),
});

type UserEditValues = z.infer<typeof userEditSchema>;

const blankUser: User = {
  id: "",
  name: "",
  email: "",
  phone: null,
  active: true,
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

export function UserEditPanel({
  mode = "edit",
  user = blankUser,
  availableAccounts,
  onSave,
  onDiscard,
}: Props) {
  const isCreate = mode === "create";
  const nameParts = user.name.split(" ");
  const form = useForm({
    defaultValues: {
      email: user.email,
      firstName: nameParts[0] ?? "",
      lastName: nameParts.slice(1).join(" "),
      role: user.role,
      accounts: user.accounts,
      notifications: {
        email: user.notification_preferences.email,
        sms: user.notification_preferences.sms,
      },
    },
    validators: { onSubmit: userEditSchema },
    onSubmit: ({ value }) => {
      onSave({
        ...user,
        email: value.email,
        name: [value.firstName, value.lastName].filter(Boolean).join(" "),
        role: value.role,
        accounts: value.accounts,
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-base font-semibold">{headerTitle}</h2>
        <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
      </div>

      <Separator />

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

        <form.Field name="email">
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

        {/* Assigned accounts */}
        <form.Field name="accounts">
          {(field) => {
            const unassigned = availableAccounts.filter(
              (a) => !field.state.value.some((ua) => ua.id === a.id),
            );

            function handleRemove(id: string) {
              field.handleChange(field.state.value.filter((a) => a.id !== id));
            }

            function handleAdd(id: string) {
              const account = availableAccounts.find((a) => a.id === id);
              if (account) {
                field.handleChange([...field.state.value, account]);
              }
            }

            return (
              <div className="flex flex-col gap-3">
                <Label>Assigned accounts</Label>

                {field.state.value.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {field.state.value.map((account) => (
                      <Badge
                        key={account.id}
                        variant="secondary"
                        className="gap-1.5 py-1 pl-2.5 pr-1.5"
                      >
                        {account.name}
                        <button
                          type="button"
                          aria-label={`Remove ${account.name}`}
                          onClick={() => handleRemove(account.id)}
                          className="flex items-center justify-center rounded-full transition-colors hover:text-foreground"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {unassigned.length > 0 && (
                  <Select onValueChange={handleAdd}>
                    <SelectTrigger className="w-full text-muted-foreground">
                      <SelectValue placeholder="Add an account..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {unassigned.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          }}
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
