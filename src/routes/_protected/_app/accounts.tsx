import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { mockCustomerAccounts } from "@/components/customer/mockData";

export const Route = createFileRoute("/_protected/_app/accounts")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/accounts" && mockCustomerAccounts.length === 1) {
      throw redirect({
        to: "/accounts/$accountId/orders",
        params: { accountId: mockCustomerAccounts[0].id },
      });
    }
  },
  component: () => <Outlet />,
});
