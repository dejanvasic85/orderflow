import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { ImageUpload } from "@/components/products/ImageUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toFieldErrors } from "@/lib/forms";
import type { CreateProductInput, Product, UpdateProductInput } from "@/lib/products/schema";

type BaseProps = {
  onDiscard: () => void;
};

type Props =
  | (BaseProps & {
      mode: "create";
      product?: Product;
      onSave: (payload: CreateProductInput) => void | Promise<void>;
      onDelete?: never;
    })
  | (BaseProps & {
      mode?: "edit";
      product: Product;
      onSave: (payload: UpdateProductInput) => void | Promise<void>;
      onDelete: (id: string) => void | Promise<void>;
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
});

export function ProductEditPanel(props: Props) {
  const { onDiscard, product } = props;
  const isCreate = (props.mode ?? "edit") === "create";
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: product?.name ?? "",
      imageUrl: product?.imageUrl ?? "",
      qtyPerBox: product?.qtyPerBox ?? 1,
    },
    validators: { onSubmit: productEditSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name,
        imageUrl: value.imageUrl || null,
        qtyPerBox: value.qtyPerBox,
      };
      if (props.mode === "create") {
        await props.onSave(payload);
        return;
      }
      await props.onSave({ ...payload, id: props.product.id });
    },
  });

  async function handleDelete() {
    if (props.mode === "create" || !props.onDelete) return;
    setDeleting(true);
    try {
      await props.onDelete(props.product.id);
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

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

        <div className="flex items-center gap-2">
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" loading={isSubmitting}>
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

      {!isCreate && props.onDelete && (
        <>
          <Separator />

          <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 p-4">
            <h3 className="text-sm font-semibold text-destructive">Delete product</h3>
            <p className="text-sm text-muted-foreground">
              This removes the product from the catalog for everyone. You cannot undo this.
            </p>
            <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="w-fit">
                  Delete product
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{props.product.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Nobody will be able to order it or see it in the catalog. You cannot undo this.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleting}
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDelete();
                    }}
                  >
                    {deleting ? "Deleting…" : "Delete product"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </div>
  );
}
