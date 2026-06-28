import { Package } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ProductThumbnailProps = {
  imageUrl: string | null;
  name: string;
  className?: string;
};

export function ProductThumbnail({ imageUrl, name, className }: ProductThumbnailProps) {
  const [errored, setErrored] = useState(false);

  if (imageUrl && !errored) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn("aspect-square shrink-0 rounded-lg object-cover", className)}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-square shrink-0 items-center justify-center rounded-lg bg-muted",
        className,
      )}
    >
      <Package className="size-5 text-muted-foreground/50" />
    </div>
  );
}
