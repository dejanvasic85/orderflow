import { Link, type LinkComponentProps } from "@tanstack/react-router";
import type { VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useNavPending } from "@/hooks/use-nav-pending";
import { cn } from "@/lib/utils";

type NavButtonProps = Omit<LinkComponentProps, "children"> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    children?: ReactNode;
  };

/** Button-styled Link that shows a spinner while the destination route loads. */
export function NavButton({ variant, size, className, children, to, ...props }: NavButtonProps) {
  const isNavPending = useNavPending();
  const pending = typeof to === "string" ? isNavPending(to) : false;

  return (
    <Link
      to={to}
      data-slot="button"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      data-loading={pending || undefined}
      aria-busy={pending || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {pending && <Loader2Icon aria-hidden className="animate-spin" />}
      {children}
    </Link>
  );
}
