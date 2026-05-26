import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/_app/accounts")({
  component: () => <Outlet />,
});
