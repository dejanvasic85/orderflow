import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { NewOrderForm } from "@/components/orderRequests/NewOrderForm";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { clearDraft } from "@/lib/orderRequests/draftOrder";
import { createOrderRequest, getOrderRequest } from "@/lib/orderRequests/orderRequests.functions";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import { listProducts } from "@/lib/products/products.functions";
import type { Product } from "@/lib/products/schema";
import { asResult } from "@/lib/result";
import { getTemplateForAccount } from "@/lib/templates/templates.functions";

const searchSchema = z.object({
  fromOrderId: z.string().optional(),
});

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/orders/new")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ fromOrderId: search.fromOrderId }),
  loader: async ({ params, deps }) => {
    const [accountResult, templateResult, productsResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      deps.fromOrderId
        ? Promise.resolve({ ok: true as const, value: null })
        : getTemplateForAccount({ data: params.accountId }),
      listProducts().then((r) => asResult<Product[]>(r)),
    ]);

    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!accountResult.value) throw notFound();
    if (!templateResult.ok) throw new Error(templateResult.error.message);
    if (!productsResult.ok) throw new Error(productsResult.error.message);

    let initialItems: OrderRequestItemInput[] | undefined;
    if (deps.fromOrderId) {
      const sourceOrderResult = await getOrderRequest({ data: deps.fromOrderId });
      if (!sourceOrderResult.ok) throw new Error(sourceOrderResult.error.message);
      if (!sourceOrderResult.value) throw notFound();
      if (sourceOrderResult.value.accountId !== params.accountId) throw notFound();
      initialItems = sourceOrderResult.value.orderRequestItems.map((i) => ({
        productId: i.productId,
        boxes: i.boxes ?? 0,
        extraUnits: i.extraUnits ?? 0,
      }));
    }

    return {
      account: accountResult.value,
      template: templateResult.value,
      products: productsResult.value,
      initialItems,
    };
  },
  component: NewOrderPage,
});

function NewOrderPage() {
  const { account, template, products, initialItems } = Route.useLoaderData();
  const { accountId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  async function handleSubmit({
    templateId,
    deliveryAddress,
    deliveryInstructions,
    items,
  }: {
    templateId: string | null;
    deliveryAddress: string | null;
    deliveryInstructions: string | null;
    items: { productId: string; boxes: number; extraUnits: number }[];
  }) {
    const result = await createOrderRequest({
      data: {
        accountId,
        templateId,
        deliveryAddress,
        deliveryInstructions,
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
      key={`${accountId}:${search.fromOrderId ?? ""}`}
      accountId={accountId}
      accountName={account.name}
      defaultDeliveryAddress={account.deliveryAddress ?? null}
      defaultDeliveryInstructions={account.deliveryInstructions ?? null}
      template={template}
      initialItems={initialItems}
      products={products}
      onBack={() => void navigate({ to: "/accounts/$accountId", params: { accountId } })}
      onSubmit={handleSubmit}
    />
  );
}
