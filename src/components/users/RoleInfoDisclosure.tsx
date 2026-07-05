import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { roleInfoValue } from "@/components/users/roleInfo";
import { userRoles } from "@/lib/users/schema";
import { cn } from "@/lib/utils";

export function RoleInfoDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg py-1 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        )}
      >
        What can each role do?
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border bg-muted/40">
          {userRoles.map((role) => {
            const info = roleInfoValue[role];
            return (
              <div key={role} className="flex flex-col gap-1.5 px-3 py-2.5">
                <span className="text-sm font-semibold">{info.label}</span>
                <ul className="flex flex-col gap-1">
                  {info.capabilities.map((capability) => (
                    <li key={capability} className="flex gap-2 text-xs text-muted-foreground">
                      <span aria-hidden="true" className="text-border">
                        &bull;
                      </span>
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
