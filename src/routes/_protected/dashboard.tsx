import { createFileRoute, useRouter } from "@tanstack/react-router";
import { supabase } from "#/lib/supabase";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="page-wrap flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="island-kicker mb-1">Dashboard</p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Welcome, {user.email}
            </h1>
          </div>
          <button
            className="button-ghost rounded-lg px-4 py-2 text-sm font-medium"
            onClick={async () => {
              await supabase.auth.signOut();
              void router.navigate({ to: "/" });
            }}
          >
            Sign out
          </button>
        </header>
      </div>
    </main>
  );
}
