import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRoundIcon, Loader2Icon, LogOutIcon, RepeatIcon, SettingsIcon } from "lucide-react";
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
import { useNavPending } from "@/hooks/use-nav-pending";
import { company } from "@/lib/config";
import { cn } from "@/lib/utils";

function getInitials(email: string) {
  const parts = email.split("@")[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type NavLink = {
  label: string;
  to: string;
};

type AccountTopNavProps = {
  email: string;
  accountId: string;
  hasMultipleAccounts: boolean;
  navLinks: NavLink[];
  onSignOut: () => void;
};

export function AccountTopNav({
  email,
  accountId: _accountId,
  hasMultipleAccounts,
  navLinks,
  onSignOut,
}: AccountTopNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNavPending = useNavPending();

  return (
    <header className="sticky top-0 z-40 hidden md:flex border-b bg-background">
      <div className="flex h-14 flex-1 items-center gap-6 px-6">
        <span className="text-sm font-bold tracking-tight shrink-0">{company.name}</span>

        <nav className="flex items-center gap-1 flex-1">
          {navLinks.map(({ label, to }) => {
            const isActive = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                data-nav-link
                data-pending={isNavPending(to)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {label}
                <Loader2Icon aria-hidden className="nav-link-spinner size-3.5" />
              </Link>
            );
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{getInitials(email)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2 px-1 py-1.5">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{getInitials(email)}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-medium">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {hasMultipleAccounts && (
                <DropdownMenuItem asChild>
                  <Link to="/accounts">
                    <RepeatIcon />
                    Change account
                  </Link>
                </DropdownMenuItem>
              )}
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
      </div>
    </header>
  );
}
