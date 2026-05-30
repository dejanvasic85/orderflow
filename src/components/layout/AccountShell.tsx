import { BookOpenIcon, ShoppingCartIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AccountTopNav } from "./AccountTopNav";
import { MobileBottomNav } from "./MobileBottomNav";

type AccountShellProps = {
  email: string;
  accountId: string;
  hasMultipleAccounts: boolean;
  onSignOut: () => void;
  children: ReactNode;
};

export function AccountShell({
  email,
  accountId,
  hasMultipleAccounts,
  onSignOut,
  children,
}: AccountShellProps) {
  const navLinks = [
    { label: "Orders", to: `/accounts/${accountId}` },
    { label: "Browse", to: `/accounts/${accountId}/browse` },
  ];

  const mobileNavItems = [
    { label: "Orders", to: `/accounts/${accountId}`, icon: ShoppingCartIcon },
    { label: "Browse", to: `/accounts/${accountId}/browse`, icon: BookOpenIcon },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col md:mx-auto md:w-full md:max-w-7xl">
      <AccountTopNav
        email={email}
        accountId={accountId}
        hasMultipleAccounts={hasMultipleAccounts}
        navLinks={navLinks}
        onSignOut={onSignOut}
      />
      <div className="mx-auto flex w-full flex-1 flex-col pb-16 md:pb-0">{children}</div>
      <MobileBottomNav
        email={email}
        navItems={mobileNavItems}
        hasMultipleAccounts={hasMultipleAccounts}
        onSignOut={onSignOut}
      />
    </div>
  );
}
