import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth/auth.functions";

const setPasswordPath = "/auth/set-password";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const user = await getSession();
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    const mustChange = user.user_metadata?.must_change_password === true;
    if (mustChange && location.pathname !== setPasswordPath) {
      throw redirect({ to: setPasswordPath });
    }
    return { user };
  },
  component: () => <Outlet />,
});
