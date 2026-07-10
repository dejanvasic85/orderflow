import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRound, Loader2, LogOut, Settings, Users, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavPending } from "@/hooks/use-nav-pending";
import { cn } from "@/lib/utils";

function getInitials(email: string) {
  const parts = email.split("@")[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: readonly NavItem[];
};

type MobileBottomNavProps = {
  email: string;
  navItems: readonly NavItem[];
  manageGroup?: NavGroup;
  hasMultipleAccounts?: boolean;
  onSignOut: () => void;
};

type SheetMenuItem =
  | { label: string; icon: LucideIcon; kind: "link"; to: string }
  | { label: string; icon: LucideIcon; kind: "button"; onClick: () => void };

const tabClass =
  "relative flex flex-col items-center gap-1 flex-1 py-2 text-xs transition-all duration-200";

const activeTabPill = (
  <span className="absolute inset-x-1 inset-y-0.5 -z-10 rounded-xl bg-sidebar-primary shadow-[0_4px_14px_0_oklch(0.205_0_0/0.35)] shadow-black/30" />
);

function tabColor(isActive: boolean) {
  return isActive
    ? "text-sidebar-primary-foreground"
    : "text-sidebar-foreground/50 hover:text-sidebar-foreground";
}

export function MobileBottomNav({
  email,
  navItems,
  manageGroup,
  hasMultipleAccounts = false,
  onSignOut,
}: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNavPending = useNavPending();
  const [accountOpen, setAccountOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  // Link taps inside the sheets keep the sheet open so the tapped item's spinner
  // stays visible while the destination route loads; the sheet closes once the
  // navigation lands on the new path.
  useEffect(() => {
    setManageOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const isManageActive = manageGroup?.items.some((item) => item.to === pathname) ?? false;

  const accountMenuItems: SheetMenuItem[] = [
    ...(hasMultipleAccounts
      ? [{ label: "Change account", icon: Users, kind: "link" as const, to: "/accounts" }]
      : []),
    { label: "Change password", icon: KeyRound, kind: "link", to: "/change-password" },
    { label: "Settings", icon: Settings, kind: "link", to: "/settings" },
    { label: "Sign out", icon: LogOut, kind: "button", onClick: onSignOut },
  ];

  const manageMenuItems: SheetMenuItem[] =
    manageGroup?.items.map((item) => ({
      label: item.label,
      icon: item.icon,
      kind: "link" as const,
      to: item.to,
    })) ?? [];

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-around h-16 px-3">
          {navItems.map(({ label, to, icon: Icon }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                data-nav-link
                data-pending={isNavPending(to)}
                className={cn(tabClass, tabColor(isActive))}
              >
                {isActive && activeTabPill}
                <span className="relative inline-flex size-5 items-center justify-center">
                  <Icon className="size-5 [[data-pending=true]_&]:invisible" />
                  <Loader2
                    aria-hidden
                    className="nav-link-spinner absolute inset-0 m-auto size-5"
                  />
                </span>
                <span className={cn("font-medium", isActive && "font-semibold")}>{label}</span>
              </Link>
            );
          })}

          {manageGroup && (
            <button
              type="button"
              aria-label={`Open ${manageGroup.label.toLowerCase()} menu`}
              onClick={() => setManageOpen(true)}
              className={cn(tabClass, tabColor(isManageActive))}
            >
              {isManageActive && activeTabPill}
              <manageGroup.icon className="size-5" />
              <span className={cn("font-medium", isManageActive && "font-semibold")}>
                {manageGroup.label}
              </span>
            </button>
          )}

          <button
            type="button"
            aria-label="Open account menu"
            onClick={() => setAccountOpen(true)}
            className="flex flex-col items-center gap-1 flex-1 py-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            <Avatar className="size-5 rounded-full">
              <AvatarFallback className="rounded-full text-[10px] bg-sidebar-accent">
                {getInitials(email)}
              </AvatarFallback>
            </Avatar>
            <span>Account</span>
          </button>
        </div>
      </nav>

      {manageGroup && (
        <Sheet open={manageOpen} onOpenChange={setManageOpen}>
          <SheetContent side="bottom" className="md:hidden rounded-t-2xl px-0 pb-10">
            <SheetHeader className="px-6 pb-4 border-b">
              <SheetTitle className="text-left text-base">{manageGroup.label}</SheetTitle>
            </SheetHeader>
            <SheetMenuList
              items={manageMenuItems}
              pathname={pathname}
              onNavigate={() => setManageOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl px-0 pb-10">
          <SheetHeader className="px-6 pb-4 border-b">
            <SheetTitle className="text-left text-sm font-normal text-muted-foreground">
              {email}
            </SheetTitle>
          </SheetHeader>
          <SheetMenuList items={accountMenuItems} onNavigate={() => setAccountOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

type SheetMenuListProps = {
  items: SheetMenuItem[];
  pathname?: string;
  onNavigate: () => void;
};

function SheetMenuList({ items, pathname, onNavigate }: SheetMenuListProps) {
  const isNavPending = useNavPending();
  const sharedClass =
    "flex items-center gap-4 px-6 py-5 text-base font-medium hover:bg-muted active:bg-muted/70 transition-colors w-full text-left";

  return (
    <div className="flex flex-col mt-2">
      {items.map((item) => {
        const Icon = item.icon;
        if (item.kind === "link") {
          const isActive = pathname === item.to;
          const pending = isNavPending(item.to);
          return (
            <Link
              key={item.label}
              to={item.to}
              // Tapping the current route won't navigate, so close the sheet
              // immediately; other links stay open showing their spinner until
              // the navigation lands (the parent closes on pathname change).
              onClick={isActive ? onNavigate : undefined}
              data-nav-link
              data-pending={pending}
              aria-busy={pending || undefined}
              className={cn(sharedClass, isActive && "bg-muted/60")}
            >
              <Icon
                className={cn(
                  "size-6 shrink-0",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              />
              <span className={cn(isActive && "font-semibold")}>{item.label}</span>
              <Loader2
                aria-hidden
                className="nav-link-spinner ml-auto size-5 text-muted-foreground"
              />
            </Link>
          );
        }
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              onNavigate();
              item.onClick();
            }}
            className={sharedClass}
          >
            <Icon className="size-6 shrink-0 text-muted-foreground" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
