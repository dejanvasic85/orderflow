import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const copiedFeedbackMs = 2000;

type Props = {
  value: string;
  label: string;
};

export function CopyButton({ value, label }: Props) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleCopy() {
    // Absent outside a secure context, where the value is still readable on screen.
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), copiedFeedbackMs);
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" aria-label={label} onClick={handleCopy}>
      {copied ? <Check className="text-green-500" /> : <Copy />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
