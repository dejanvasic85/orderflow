import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { getDashboardStats } from "@/lib/dashboard/dashboard.functions";
import type { DashboardData } from "@/lib/dashboard/schema";
import { asResult } from "@/lib/result";
import { unwrapOrThrow } from "@/lib/resultLoader";

export const Route = createFileRoute("/_protected/manage/dashboard")({
  loader: async () => {
    const result = asResult<DashboardData>(await getDashboardStats());
    return unwrapOrThrow(result);
  },
  component: DashboardPage,
});

function DashboardPage() {
  const data = Route.useLoaderData();
  return (
    <>
      <PageHeader title="Dashboard" />
      <PageContent>
        <DashboardView data={data} />
      </PageContent>
    </>
  );
}
