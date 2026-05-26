import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { NewOrderForm } from "@/components/orderRequests/NewOrderForm";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { createOrderRequest } from "@/lib/orderRequests/orderRequests.functions";
import type { CreateOrderRequestInput } from "@/lib/orderRequests/schema";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { getTemplateForAccount } from "@/lib/templates/templates.functions";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/orders/new")({
  loader: async ({ params }) => {
    const accountResult = await getAccount({ data: params.accountId });
    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!accountResult.value) throw notFound();

    const templateResult = await getTemplateForAccount({ data: params.accountId });
    if (!templateResult.ok) throw new Error(templateResult.error.message);

    return {
      account: accountResult.value,
      template: templateResult.value as TemplateWithItems | null,
    };
  },
  component: NewOrderPage,
});

function NewOrderPage() {
  const { account, template } = Route.useLoaderData();
  const { accountId } = Route.useParams();
  const navigate = useNavigate();

  async function handleSubmit(data: CreateOrderRequestInput) {
    const result = await createOrderRequest({ data });
    if (!result.ok) throw new Error(result.error.message);
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
      onSubmit={handleSubmit}
    />
  );
}
