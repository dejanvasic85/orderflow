import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";
import { company } from "@/lib/config";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 px-4 backdrop-blur-lg">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-foreground no-underline transition-colors hover:bg-muted sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-foreground" />
            {company.shortName}
          </Link>
        </h2>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <ThemeToggle />
        </div>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/"
            className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
            activeProps={{ className: "active" }}
          >
            Home
          </Link>
          <Link
            to="/users"
            className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
            activeProps={{ className: "active" }}
          >
            Users
          </Link>
        </div>
      </nav>
    </header>
  );
}
