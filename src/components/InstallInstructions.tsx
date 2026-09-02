import { ShareIcon, SquarePlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { company } from "@/lib/config";

interface InstallInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Manual "Add to Home Screen" steps for browsers with no install prompt. */
export function InstallInstructions({ open, onOpenChange }: InstallInstructionsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install {company.shortName.toUpperCase()}</DialogTitle>
          <DialogDescription>
            Safari on iPhone and iPad installs apps from the Share menu rather than a prompt. Two
            steps:
          </DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-3">
          <li className="flex items-center gap-3">
            <ShareIcon size={20} className="shrink-0 text-primary" aria-hidden="true" />
            <span>
              Tap <strong>Share</strong> in the browser toolbar.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <SquarePlusIcon size={20} className="shrink-0 text-primary" aria-hidden="true" />
            <span>
              Choose <strong>Add to Home Screen</strong>.
            </span>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
