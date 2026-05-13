import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContentProps = {
  children: ReactNode;
  className?: string;
};

export function PageContent({ children, className }: PageContentProps) {
  return <div className={cn("flex flex-1 flex-col gap-6 p-6", className)}>{children}</div>;
}
