import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";

type Props = {
  invitedAt: string;
  onResend: () => Promise<void>;
};

export function PendingInviteSection({ invitedAt, onResend }: Props) {
  const [displayedInvitedAt, setDisplayedInvitedAt] = useState(invitedAt);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayedInvitedAt(invitedAt);
  }, [invitedAt]);

  async function handleResend() {
    setLoading(true);
    try {
      await onResend();
      const now = new Date().toISOString();
      setDisplayedInvitedAt(now);
      toast.success("Invitation sent");
    } catch {
      toast.error("Failed to resend invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Invitation</h3>
      <p className="text-sm text-muted-foreground">Sent {formatDateTime(displayedInvitedAt)}</p>
      <Button
        type="button"
        size="sm"
        className="w-full sm:w-fit"
        disabled={loading}
        onClick={handleResend}
      >
        {loading ? "Sending…" : "Resend invitation"}
      </Button>
    </div>
  );
}
