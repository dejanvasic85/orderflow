import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  onBack?: () => void;
};

export function PageHeader({ title, description, actions, onBack }: PageHeaderProps) {
  return (
    <>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="md:hidden flex items-center gap-1 px-4 pt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </>
  );
}
