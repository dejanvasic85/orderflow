import { createFileRoute, notFound } from "@tanstack/react-router";
import { NewOrderForm } from "@/components/orderRequests/NewOrderForm";
import { getAccount } from "@/lib/accounts/accounts.functions";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { getTemplateForAccount } from "@/lib/templates/templates.functions";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/orders/new")({
  loader: async ({ params }) => {
    const accountResult = await getAccount({ data: params.accountId });
    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!accountResult.value) throw notFound();

    const templateResult = await getTemplateForAccount({
      data: params.accountId,
    });
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

  return <NewOrderForm accountId={accountId} accountName={account.name} template={template} />;
}
