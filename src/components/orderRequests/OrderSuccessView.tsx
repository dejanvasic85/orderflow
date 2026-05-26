import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderSuccessViewProps = {
  accountId: string;
};

export function OrderSuccessView({ accountId }: OrderSuccessViewProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" strokeWidth={1.5} />
        <h1 className="text-2xl font-semibold tracking-tight">Order submitted</h1>
        <p className="text-sm text-muted-foreground">
          Your order has been received and is being processed.
        </p>
      </div>

      <div className="mt-6">
        <Button variant="outline" size="lg" className="w-full" asChild>
          <Link to="/accounts/$accountId" params={{ accountId }}>
            Back to orders
          </Link>
        </Button>
      </div>
    </div>
  );
}
