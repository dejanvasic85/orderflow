import { toast } from "sonner";
import { company } from "@/lib/config";

const installToastCopyValue = {
  message: `Install ${company.shortName.toUpperCase()} on this device for a faster start.`,
  actionLabel: "Install",
} as const;

export interface InstallToastHandlers {
  onInstall: () => void;
  onDismiss: () => void;
}

/** Shows the install offer as a toast that stays until the user answers it. */
export function showInstallToast({ onInstall, onDismiss }: InstallToastHandlers): void {
  toast(installToastCopyValue.message, {
    duration: Number.POSITIVE_INFINITY,
    closeButton: true,
    action: { label: installToastCopyValue.actionLabel, onClick: onInstall },
    onDismiss,
  });
}
