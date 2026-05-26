import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { accountNavItemsValue } from "@/lib/routes";
import { supabase } from "@/lib/supabase";
import { AccountTopNav } from "./AccountTopNav";
import { MobileBottomNav } from "./MobileBottomNav";

type AccountShellProps = {
  email: string;
  accountId: string;
  hasMultipleAccounts: boolean;
  children: ReactNode;
};

export function AccountShell({
  email,
  accountId,
  hasMultipleAccounts,
  children,
}: AccountShellProps) {
  const router = useRouter();
  const navLinks = [
    { label: "Orders", to: `/accounts/${accountId}` },
    { label: "Browse", to: "/browse" },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    void router.navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen flex-col md:mx-auto md:w-full md:max-w-7xl">
      <AccountTopNav
        email={email}
        accountId={accountId}
        hasMultipleAccounts={hasMultipleAccounts}
        navLinks={navLinks}
        onSignOut={handleSignOut}
      />
      <div className="mx-auto flex w-full flex-1 flex-col pb-16 md:pb-0">{children}</div>
      <MobileBottomNav
        email={email}
        navItems={accountNavItemsValue}
        hasMultipleAccounts={hasMultipleAccounts}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
