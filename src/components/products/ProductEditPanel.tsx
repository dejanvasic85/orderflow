import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { ImageUpload } from "@/components/products/ImageUpload";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { CreateProductInput, Product, UpdateProductInput } from "@/lib/products/schema";

type BaseProps = {
  onDiscard: () => void;
};

type Props =
  | (BaseProps & {
      mode: "create";
      product?: Product;
      onSave: (payload: CreateProductInput) => void | Promise<void>;
    })
  | (BaseProps & {
      mode?: "edit";
      product: Product;
      onSave: (payload: UpdateProductInput) => void | Promise<void>;
    });

const productEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z
    .string()
    .refine((v) => v === "" || z.url().safeParse(v).success, "Must be a valid URL"),
  qtyPerBox: z
    .number("Must be a whole number")
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
  active: z.boolean(),
});

function toFieldErrors(errors: unknown[]): { message?: string }[] {
  return errors.map((e) => ({
    message: typeof e === "string" ? e : (e as { message?: string })?.message,
  }));
}

export function ProductEditPanel(props: Props) {
  const { onDiscard, product } = props;
  const isCreate = (props.mode ?? "edit") === "create";

  const form = useForm({
    defaultValues: {
      name: product?.name ?? "",
      imageUrl: product?.imageUrl ?? "",
      qtyPerBox: product?.qtyPerBox ?? 1,
      active: product?.active ?? true,
    },
    validators: { onSubmit: productEditSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name,
        imageUrl: value.imageUrl || null,
        qtyPerBox: value.qtyPerBox,
        active: value.active,
      };
      if (props.mode === "create") {
        await props.onSave(payload);
        return;
      }
      await props.onSave({ ...payload, id: props.product.id });
    },
  });

  const headerTitle = isCreate ? "New product" : (product?.name ?? "");
  const headerSubtitle = isCreate
    ? "Add a product to the catalog"
    : "Update product details and availability";
  const submitLabel = isCreate ? "Create product" : "Save changes";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-base font-semibold">{headerTitle}</h2>
        <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
      </div>

      <Separator />

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="product-name">Name</FieldLabel>
              <Input
                id="product-name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Field name="imageUrl">
          {(field) => (
            <Field>
              <FieldLabel>Image</FieldLabel>
              <ImageUpload
                currentUrl={field.state.value || null}
                onUploaded={(url) => field.handleChange(url)}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Field name="qtyPerBox">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="product-qty-per-box">Quantity per box</FieldLabel>
              <Input
                id="product-qty-per-box"
                type="number"
                min={1}
                value={Number.isNaN(field.state.value) ? "" : field.state.value}
                onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <Separator />

        <form.Field name="active">
          {(field) => (
            <div className="flex flex-col gap-3">
              <Label>Availability</Label>
              <div className="flex items-center gap-3">
                <Switch
                  id="product-active"
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(v)}
                />
                <Label htmlFor="product-active" className="font-normal">
                  Active
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Inactive products are hidden from the customer catalog.
              </p>
            </div>
          )}
        </form.Field>

        <Separator />

        <div className="flex items-center gap-2">
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : submitLabel}
              </Button>
            )}
          </form.Subscribe>
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
