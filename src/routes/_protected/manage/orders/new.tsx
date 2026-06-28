import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountCombobox } from "@/components/orderRequests/AccountCombobox";
import { NewOrderForm } from "@/components/orderRequests/NewOrderForm";
import { getAccount, listAccounts } from "@/lib/accounts/accounts.functions";
import type { PagedAccountsResult } from "@/lib/accounts/schema";
import {
  createOrderRequestOnBehalf,
  getOrderRequestAsAdminOrStaff,
} from "@/lib/orderRequests/orderRequests.functions";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import { listProducts } from "@/lib/products/products.functions";
import type { ProductRow } from "@/lib/products/schema";
import { asResult } from "@/lib/result";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { getTemplateForAccount } from "@/lib/templates/templates.functions";

const searchSchema = z.object({
  accountId: z.string().optional(),
  fromOrderId: z.string().optional(),
});

export const Route = createFileRoute("/_protected/manage/orders/new")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ accountId: search.accountId, fromOrderId: search.fromOrderId }),
  loader: async ({ deps }) => {
    const [accountsResult, productsResult] = await Promise.all([
      listAccounts({ data: {} }).then((r) => asResult<PagedAccountsResult>(r)),
      listProducts().then((r) => asResult<ProductRow[]>(r)),
    ]);
    if (!accountsResult.ok) throw new Error(accountsResult.error.message);
    if (!productsResult.ok) throw new Error(productsResult.error.message);

    let sourceOrderItems: OrderRequestItemInput[] | undefined;
    let resolvedAccountId = deps.accountId;

    if (deps.fromOrderId) {
      const sourceOrderResult = await getOrderRequestAsAdminOrStaff({ data: deps.fromOrderId });
      if (!sourceOrderResult.ok) throw new Error(sourceOrderResult.error.message);
      if (!sourceOrderResult.value) throw new Error("Source order not found");
      const sourceOrder = sourceOrderResult.value;
      if (
        resolvedAccountId &&
        sourceOrder.account_id &&
        resolvedAccountId !== sourceOrder.account_id
      ) {
        throw new Error("accountId does not match the source order's account");
      }
      resolvedAccountId = resolvedAccountId ?? sourceOrder.account_id;
      sourceOrderItems = sourceOrder.order_request_items.map((i) => ({
        product_id: i.product_id,
        boxes: i.boxes ?? 0,
        extra_units: i.extra_units ?? 0,
      }));
    }

    if (!resolvedAccountId) {
      return {
        accounts: accountsResult.value.accounts,
        products: productsResult.value,
        selected: null,
      };
    }

    const [accountResult, templateResult] = await Promise.all([
      getAccount({ data: resolvedAccountId }),
      deps.fromOrderId
        ? Promise.resolve({ ok: true as const, value: null })
        : getTemplateForAccount({ data: resolvedAccountId }),
    ]);
    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!templateResult.ok) throw new Error(templateResult.error.message);

    return {
      accounts: accountsResult.value.accounts,
      products: productsResult.value,
      selected: accountResult.value
        ? {
            account: accountResult.value,
            template: templateResult.value as TemplateWithItems | null,
            initialItems: sourceOrderItems,
          }
        : null,
    };
  },
  component: ManageNewOrderPage,
});

function ManageNewOrderPage() {
  const { accounts, products, selected } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  function handleSelectAccount(accountId: string) {
    void navigate({ to: "/manage/orders/new", search: { accountId } });
  }

  async function handleSubmit({
    templateId,
    deliveryInstructions,
    items,
  }: {
    templateId: string | null;
    deliveryInstructions: string | null;
    items: { product_id: string; boxes: number; extra_units: number }[];
  }) {
    if (!selected) return;
    const result = await createOrderRequestOnBehalf({
      data: {
        account_id: selected.account.id,
        template_id: templateId,
        delivery_instructions: deliveryInstructions,
        items,
      },
    });
    if (!result.ok) throw new Error(result.error.message);
    toast.success("Order request created");
    void navigate({ to: "/manage/orders/$orderId", params: { orderId: result.value.id } });
  }

  return (
    <>
      <PageHeader title="New order" description="Place an order on behalf of an account" />
      <PageContent>
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Account
            </legend>
            <AccountCombobox
              accounts={accounts}
              selectedId={selected?.account.id ?? null}
              onSelect={handleSelectAccount}
            />
          </fieldset>
        </div>

        {selected && (
          <NewOrderForm
            key={`${selected.account.id}:${search.fromOrderId ?? ""}`}
            accountId={selected.account.id}
            accountName={selected.account.name}
            defaultDeliveryInstructions={selected.account.delivery_instructions ?? null}
            template={selected.template}
            initialItems={selected.initialItems}
            products={products}
            persistDraft={false}
            onBack={() => void navigate({ to: "/manage/orders" })}
            onSubmit={handleSubmit}
          />
        )}
      </PageContent>
    </>
  );
}
