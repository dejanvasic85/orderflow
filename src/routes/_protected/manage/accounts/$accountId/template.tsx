import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import type { TemplateEditorPayload } from "@/components/templates/TemplateEditor";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { can, permissions } from "@/lib/permissions";
import { listProducts } from "@/lib/products/products.functions";
import type { Product } from "@/lib/products/schema";
import { asResult } from "@/lib/result";
import { unwrapOrThrow, valueOrNotFound } from "@/lib/resultLoader";
import { getTemplateForAccount, saveTemplateItems } from "@/lib/templates/templates.functions";

export const Route = createFileRoute("/_protected/manage/accounts/$accountId/template")({
  loader: async ({ params }) => {
    const [accountResult, templateResult, productsResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      getTemplateForAccount({ data: params.accountId }),
      listProducts().then((r) => asResult<Product[]>(r)),
    ]);

    return {
      account: valueOrNotFound(unwrapOrThrow(accountResult)),
      template: unwrapOrThrow(templateResult),
      products: unwrapOrThrow(productsResult),
    };
  },
  component: AccountTemplatePage,
});

function AccountTemplatePage() {
  const { account, template, products } = Route.useLoaderData();
  const { user } = useRouteContext({ from: "/_protected" });
  const canWriteTemplates = can(user.user_role, permissions.templates.write);

  async function handleSave(payload: TemplateEditorPayload) {
    const result = asResult(await saveTemplateItems({ data: payload }));
    if (!result.ok) {
      toast.error(result.error.message);
      throw new Error(result.error.message);
    }
    toast.success("Template saved");
  }

  return (
    <>
      <PageHeader title={`${account.name} — Template`} />
      <PageContent>
        <TemplateEditor
          account={account}
          template={template}
          products={products}
          readOnly={!canWriteTemplates}
          onSave={handleSave}
        />
      </PageContent>
    </>
  );
}
