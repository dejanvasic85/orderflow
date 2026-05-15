import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navItemsValue } from "@/lib/routes";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function getInitials(email: string) {
  const parts = email.split("@")[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type MobileBottomNavProps = {
  email: string;
};

export function MobileBottomNav({ email }: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await supabase.auth.signOut();
    void router.navigate({ to: "/" });
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-around h-16 px-2">
        {navItemsValue.map(({ label, to, icon: Icon }) => {
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center gap-1 flex-1 py-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
              <Avatar className="size-5 rounded-full">
                <AvatarFallback className="rounded-full text-[10px] bg-sidebar-accent">
                  {getInitials(email)}
                </AvatarFallback>
              </Avatar>
              <span>Account</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-48 mb-1">
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
