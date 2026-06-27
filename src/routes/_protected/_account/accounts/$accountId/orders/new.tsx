import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { NewOrderForm } from "@/components/orderRequests/NewOrderForm";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { clearDraft } from "@/lib/orderRequests/draftOrder";
import { createOrderRequest } from "@/lib/orderRequests/orderRequests.functions";
import { listProducts } from "@/lib/products/products.functions";
import type { ProductRow } from "@/lib/products/schema";
import { asResult } from "@/lib/result";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { getTemplateForAccount } from "@/lib/templates/templates.functions";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/orders/new")({
  loader: async ({ params }) => {
    const [accountResult, templateResult, productsResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      getTemplateForAccount({ data: params.accountId }),
      listProducts().then((r) => asResult<ProductRow[]>(r)),
    ]);

    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!accountResult.value) throw notFound();
    if (!templateResult.ok) throw new Error(templateResult.error.message);
    if (!productsResult.ok) throw new Error(productsResult.error.message);

    return {
      account: accountResult.value,
      template: templateResult.value as TemplateWithItems | null,
      products: productsResult.value,
    };
  },
  component: NewOrderPage,
});

function NewOrderPage() {
  const { account, template, products } = Route.useLoaderData();
  const { accountId } = Route.useParams();
  const navigate = useNavigate();

  async function handleSubmit({
    templateId,
    deliveryInstructions,
    items,
  }: {
    templateId: string | null;
    deliveryInstructions: string | null;
    items: { product_id: string; boxes: number; extra_units: number }[];
  }) {
    const result = await createOrderRequest({
      data: {
        account_id: accountId,
        template_id: templateId,
        delivery_instructions: deliveryInstructions,
        items,
      },
    });
    if (!result.ok) throw new Error(result.error.message);
    toast.success("Order request submitted");
    clearDraft(accountId);
    void navigate({
      to: "/accounts/$accountId/orders/$orderId/success",
      params: { accountId, orderId: result.value.id },
    });
  }

  return (
    <NewOrderForm
      accountId={accountId}
      accountName={account.name}
      defaultDeliveryInstructions={account.delivery_instructions ?? null}
      template={template}
      products={products}
      onBack={() => void navigate({ to: "/accounts/$accountId", params: { accountId } })}
      onSubmit={handleSubmit}
    />
  );
}
