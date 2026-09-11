import { cn } from "@/lib/utils";

type PlacedByNameProps = {
  name: string;
  /** The person has since been deleted. Their name is still shown so the order stays attributable. */
  deleted?: boolean;
  className?: string;
};

export function PlacedByName({ name, deleted, className }: PlacedByNameProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-baseline gap-1", className)}>
      <span className="truncate">{name}</span>
      {deleted && <span className="shrink-0 font-normal text-muted-foreground">(deleted)</span>}
    </span>
  );
}
