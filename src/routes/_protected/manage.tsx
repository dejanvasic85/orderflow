import { Outlet, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_protected/manage")({
  beforeLoad: ({ context }) => {
    const user = context.user as unknown as { user_role?: string };
    if (user.user_role !== "admin" && user.user_role !== "staff") {
      throw redirect({ to: "/accounts" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    void router.navigate({ to: "/" });
  }

  return (
    <AdminShell email={user.email ?? ""} onSignOut={handleSignOut}>
      <Outlet />
    </AdminShell>
  );
}
