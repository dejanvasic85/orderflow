import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { adminNavItemsValue } from "@/lib/routes";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

type AdminShellProps = {
  email: string;
  children: ReactNode;
};

export function AdminShell({ email, children }: AdminShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar email={email} />
      <SidebarInset>
        <div className="flex flex-1 flex-col pb-16 md:pb-0">{children}</div>
        <MobileBottomNav email={email} navItems={adminNavItemsValue} />
      </SidebarInset>
    </SidebarProvider>
  );
}
