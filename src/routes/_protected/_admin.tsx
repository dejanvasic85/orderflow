import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";

export const Route = createFileRoute("/_protected/_admin")({
  beforeLoad: ({ context }) => {
    const user = context.user as unknown as { user_role?: string };
    if (user.user_role === "user") {
      throw redirect({ to: "/accounts" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AdminShell email={user.email ?? ""}>
      <Outlet />
    </AdminShell>
  );
}
