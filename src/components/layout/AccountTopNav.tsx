import { Link, useRouterState } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {label}
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
          <DropdownMenuContent side="bottom" align="end" className="w-48">
            {hasMultipleAccounts && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/accounts">Change account</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/change-password">Change password</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
