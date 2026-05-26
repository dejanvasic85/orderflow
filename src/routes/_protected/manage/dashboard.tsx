import { createFileRoute } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { company } from "@/lib/config";

export const Route = createFileRoute("/_protected/manage/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <PageContent>
        <p className="text-muted-foreground">Welcome to {company.name}.</p>
      </PageContent>
    </>
  );
}
