import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getSession } from "@/lib/authFunctions";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const user = await getSession();
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { user };
  },
  component: () => <Outlet />,
});
