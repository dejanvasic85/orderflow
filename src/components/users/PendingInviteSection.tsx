import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  invitedAt: string;
  onResend: () => Promise<void>;
};

function formatInviteDate(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

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
      <p className="text-sm text-muted-foreground">Sent {formatInviteDate(displayedInvitedAt)}</p>
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleResend}>
        {loading ? "Sending…" : "Resend invitation"}
      </Button>
    </div>
  );
}
