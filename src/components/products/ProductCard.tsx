import { Package } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductRow } from "@/lib/products/schema";

type ProductImageProps = {
  imageUrl: string | null;
  name: string;
};

type ProductCardProps = {
  product: ProductRow;
  action?: React.ReactNode;
};

function ProductImage({ imageUrl, name }: ProductImageProps) {
  const [errored, setErrored] = useState(false);

  if (imageUrl && !errored) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="aspect-[4/3] w-full object-cover"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center">
      <Package className="size-10 text-muted-foreground/40" />
    </div>
  );
}

export function ProductCard({ product, action }: ProductCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <ProductImage imageUrl={product.image_url} name={product.name} />
      <CardHeader className="flex-1">
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          {product.qty_per_box} per box
        </Badge>
        {action}
      </CardContent>
    </Card>
  );
}
