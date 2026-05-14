import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

type AppShellProps = {
  email: string;
  children: ReactNode;
};

export function AppShell({ email, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar email={email} />
      <SidebarInset>
        <div className="flex flex-1 flex-col pb-16 md:pb-0">{children}</div>
        <MobileBottomNav email={email} />
      </SidebarInset>
    </SidebarProvider>
  );
}
