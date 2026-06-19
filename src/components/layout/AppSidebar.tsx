import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRoundIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { company } from "@/lib/config";
import { adminNavItemsValue } from "@/lib/routes";

// Future routes — uncomment when pages are created:
// { label: "Accounts", to: "/accounts", icon: BuildingIcon },
// { label: "Products", to: "/products", icon: PackageIcon },

type AppSidebarProps = {
  email: string;
  onSignOut: () => void;
};

function getInitials(email: string) {
  const parts = email.split("@")[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar({ email, onSignOut }: AppSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 py-6">
        <div className="flex h-8 items-center justify-between px-2">
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-none tracking-tight text-sidebar-foreground">
              {company.name}
            </span>
          </div>
          <SidebarTrigger className="-mr-1 text-sidebar-foreground/60 hover:text-sidebar-foreground" />
        </div>
        <span className="px-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          Wholesale portal
        </span>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {adminNavItemsValue.map(({ label, to, icon: Icon }) => (
            <SidebarMenuItem key={to}>
              <SidebarMenuButton
                asChild
                tooltip={label}
                isActive={pathname === to}
                className="text-sidebar-foreground/60 hover:bg-transparent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
              >
                <Link to={to}>
                  <Icon />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <Avatar className="size-7 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs">
                      {getInitials(email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 overflow-hidden text-left leading-none">
                    <span className="truncate text-xs font-medium">{email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2 px-1 py-1.5">
                  <Avatar className="size-7 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs">
                      {getInitials(email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs font-medium">{email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <SettingsIcon />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/change-password">
                      <KeyRoundIcon />
                      Change password
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
