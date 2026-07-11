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
import type { Product } from "@/lib/products/schema";
import { asResult } from "@/lib/result";
import { unwrapOrThrow, valueOrNotFound } from "@/lib/resultLoader";
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
      listProducts().then((r) => asResult<Product[]>(r)),
    ]);
    const accounts = unwrapOrThrow(accountsResult);
    const products = unwrapOrThrow(productsResult);

    let sourceOrderItems: OrderRequestItemInput[] | undefined;
    let resolvedAccountId = deps.accountId;

    if (deps.fromOrderId) {
      const sourceOrderResult = await getOrderRequestAsAdminOrStaff({ data: deps.fromOrderId });
      const sourceOrder = valueOrNotFound(unwrapOrThrow(sourceOrderResult));
      if (
        resolvedAccountId &&
        sourceOrder.accountId &&
        resolvedAccountId !== sourceOrder.accountId
      ) {
        throw new Error("accountId does not match the source order's account");
      }
      resolvedAccountId = resolvedAccountId ?? sourceOrder.accountId;
      sourceOrderItems = sourceOrder.orderRequestItems.map((i) => ({
        productId: i.productId,
        boxes: i.boxes ?? 0,
        extraUnits: i.extraUnits ?? 0,
      }));
    }

    if (!resolvedAccountId) {
      return { accounts: accounts.accounts, products, selected: null };
    }

    const [accountResult, templateResult] = await Promise.all([
      getAccount({ data: resolvedAccountId }),
      deps.fromOrderId
        ? Promise.resolve({ ok: true as const, value: null })
        : getTemplateForAccount({ data: resolvedAccountId }),
    ]);
    const account = unwrapOrThrow(accountResult);
    const template = unwrapOrThrow(templateResult);

    return {
      accounts: accounts.accounts,
      products,
      selected: account
        ? {
            account,
            template,
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
    deliveryAddress,
    deliveryInstructions,
    items,
  }: {
    templateId: string | null;
    deliveryAddress: string | null;
    deliveryInstructions: string | null;
    items: { productId: string; boxes: number; extraUnits: number }[];
  }) {
    if (!selected) return;
    const result = await createOrderRequestOnBehalf({
      data: {
        accountId: selected.account.id,
        templateId,
        deliveryAddress,
        deliveryInstructions,
        items,
      },
    });
    const order = unwrapOrThrow(result);
    toast.success("Order request created");
    void navigate({ to: "/manage/orders/$orderId", params: { orderId: order.id } });
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
            defaultDeliveryAddress={selected.account.deliveryAddress ?? null}
            defaultDeliveryInstructions={selected.account.deliveryInstructions ?? null}
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
