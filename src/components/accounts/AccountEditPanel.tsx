import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Account } from "@/lib/accounts/schema";
import { toFieldErrors } from "@/lib/forms";

type Props = {
  account: Account;
  readOnly?: boolean;
  onSave: (updated: Account) => void | Promise<void>;
  onDiscard: () => void;
};

const accountEditSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  contactName: z.string(),
  contactEmail: z
    .string()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Must be a valid email address"),
  contactPhone: z.string(),
  deliveryAddress: z.string(),
  deliveryInstructions: z.string(),
});

export function AccountEditPanel({ account, readOnly = false, onSave, onDiscard }: Props) {
  const form = useForm({
    defaultValues: {
      name: account.name,
      contactName: account.contactName ?? "",
      contactEmail: account.contactEmail ?? "",
      contactPhone: account.contactPhone ?? "",
      deliveryAddress: account.deliveryAddress ?? "",
      deliveryInstructions: account.deliveryInstructions ?? "",
    },
    validators: { onSubmit: accountEditSchema },
    onSubmit: async ({ value }) => {
      await onSave({
        ...account,
        name: value.name,
        contactName: value.contactName || null,
        contactEmail: value.contactEmail || null,
        contactPhone: value.contactPhone || null,
        deliveryAddress: value.deliveryAddress || null,
        deliveryInstructions: value.deliveryInstructions || null,
      });
      toast.success("Changes saved");
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{account.name}</h2>
          <p className="text-sm text-muted-foreground">Account details</p>
        </div>
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
          <form.Field name="contactName">
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
            <form.Field name="contactEmail">
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

            <form.Field name="contactPhone">
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
          <form.Field name="deliveryAddress">
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

          <form.Field name="deliveryInstructions">
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
          {!readOnly && (
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save changes"}
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
