import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRound, LogOut, Settings, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

type MobileBottomNavProps = {
  email: string;
  navItems: readonly NavItem[];
  hasMultipleAccounts?: boolean;
  onSignOut: () => void;
};

type AccountMenuItem =
  | { label: string; icon: LucideIcon; kind: "link"; to: string }
  | { label: string; icon: LucideIcon; kind: "button"; onClick: () => void };

export function MobileBottomNav({
  email,
  navItems,
  hasMultipleAccounts = false,
  onSignOut,
}: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const accountMenuItems: AccountMenuItem[] = [
    ...(hasMultipleAccounts
      ? [{ label: "Change account", icon: Users, kind: "link" as const, to: "/accounts" }]
      : []),
    { label: "Change password", icon: KeyRound, kind: "link", to: "/change-password" },
    { label: "Settings", icon: Settings, kind: "link", to: "/settings" },
    { label: "Sign out", icon: LogOut, kind: "button", onClick: onSignOut },
  ];

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ label, to, icon: Icon }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1 py-2 text-xs transition-colors",
                  isActive
                    ? "text-sidebar-foreground"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            aria-label="Open account menu"
            onClick={() => setOpen(true)}
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl px-0 pb-10">
          <SheetHeader className="px-6 pb-4 border-b">
            <SheetTitle className="text-left text-sm font-normal text-muted-foreground">
              {email}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col mt-2">
            {accountMenuItems.map((item) => {
              const Icon = item.icon;
              const sharedClass =
                "flex items-center gap-4 px-6 py-5 text-base font-medium hover:bg-muted active:bg-muted/70 transition-colors w-full text-left";
              if (item.kind === "link") {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={sharedClass}
                  >
                    <Icon className="size-6 shrink-0 text-muted-foreground" />
                    <span>{item.label}</span>
                  </Link>
                );
              }
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
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
        </SheetContent>
      </Sheet>
    </>
  );
}
