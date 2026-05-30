import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Account } from "@/lib/accounts/schema";
import { AccountUserSection } from "./AccountUserSection";

type Props = {
  account: Account;
  readOnly?: boolean;
  onSave: (updated: Account) => void;
  onDiscard: () => void;
  onUserCountChange?: (delta: 1 | -1) => void;
};

const accountEditSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  contact_name: z.string(),
  contact_email: z
    .string()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Must be a valid email address"),
  contact_phone: z.string(),
  delivery_address: z.string(),
  delivery_instructions: z.string(),
});

function toFieldErrors(errors: unknown[]): { message?: string }[] {
  return errors.map((e) => ({
    message: typeof e === "string" ? e : (e as { message?: string })?.message,
  }));
}

export function AccountEditPanel({
  account,
  readOnly = false,
  onSave,
  onDiscard,
  onUserCountChange,
}: Props) {
  const form = useForm({
    defaultValues: {
      name: account.name,
      contact_name: account.contact_name ?? "",
      contact_email: account.contact_email ?? "",
      contact_phone: account.contact_phone ?? "",
      delivery_address: account.delivery_address ?? "",
      delivery_instructions: account.delivery_instructions ?? "",
    },
    validators: { onSubmit: accountEditSchema },
    onSubmit: ({ value }) => {
      onSave({
        ...account,
        name: value.name,
        contact_name: value.contact_name || null,
        contact_email: value.contact_email || null,
        contact_phone: value.contact_phone || null,
        delivery_address: value.delivery_address || null,
        delivery_instructions: value.delivery_instructions || null,
      });
      toast.success("Changes saved");
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-base font-semibold">{account.name}</h2>
        <p className="text-sm text-muted-foreground">Account details</p>
      </div>

      <Separator />

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        {/* Account name */}
        <form.Field name="name">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="account-name">Account name</FieldLabel>
              <Input
                id="account-name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={readOnly}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        {/* Contact details */}
        <div className="flex flex-col gap-4">
          <form.Field name="contact_name">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="contact-name">Contact name</FieldLabel>
                <Input
                  id="contact-name"
                  placeholder="Full name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={readOnly}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="contact_email">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                  <Input
                    id="contact-email"
                    placeholder="email@example.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={readOnly}
                  />
                  <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                </Field>
              )}
            </form.Field>

            <form.Field name="contact_phone">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="Phone number"
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
        </div>

        {/* Delivery details */}
        <div className="flex flex-col gap-4">
          <form.Field name="delivery_address">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="delivery-address">Delivery address</FieldLabel>
                <Input
                  id="delivery-address"
                  placeholder="Street address"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={readOnly}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="delivery_instructions">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="delivery-instructions">Delivery instructions</FieldLabel>
                <Textarea
                  id="delivery-instructions"
                  placeholder="Special instructions for delivery..."
                  rows={3}
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

        <div className="flex items-center gap-2">
          {!readOnly && <Button type="submit">Save changes</Button>}
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

      {account.id && (
        <>
          <Separator />
          <AccountUserSection accountId={account.id} onUserCountChange={onUserCountChange} />
        </>
      )}
    </div>
  );
}
