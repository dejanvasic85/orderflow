import { createFileRoute } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_protected/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <PageContent>
        <p className="text-muted-foreground">Welcome to OrderFlow.</p>
      </PageContent>
    </>
  );
}
