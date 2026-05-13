import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_protected/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AppShell email={user.email ?? ""}>
      <Outlet />
    </AppShell>
  );
}
