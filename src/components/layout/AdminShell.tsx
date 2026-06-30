import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { adminManageGroupValue, adminMobileNavItemsValue } from "@/lib/routes";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

type AdminShellProps = {
  email: string;
  onSignOut: () => void;
  children: ReactNode;
};

export function AdminShell({ email, onSignOut, children }: AdminShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar email={email} onSignOut={onSignOut} />
      <SidebarInset>
        <div className="flex flex-1 flex-col pb-16 md:pb-0">{children}</div>
        <MobileBottomNav
          email={email}
          navItems={adminMobileNavItemsValue}
          manageGroup={adminManageGroupValue}
          onSignOut={onSignOut}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
