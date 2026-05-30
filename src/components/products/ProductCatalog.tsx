import { Package, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { ProductRow } from "@/lib/products/schema";

type ProductCatalogProps = {
  products: ProductRow[];
};

type ProductImageProps = {
  imageUrl: string | null;
  name: string;
};

type ProductCardProps = {
  product: ProductRow;
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

function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <ProductImage imageUrl={product.image_url} name={product.name} />
      <CardHeader>
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
        {product.description && (
          <CardDescription className="line-clamp-3">{product.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">{product.qty_per_box} per box</Badge>
      </CardContent>
    </Card>
  );
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          (p.description ?? "").toLowerCase().includes(trimmed),
      )
    : products;

  if (products.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
          <EmptyTitle>No products available</EmptyTitle>
          <EmptyDescription>Products will appear here once they're added.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <InputGroup className="max-w-sm">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search products"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No products found</EmptyTitle>
            <EmptyDescription>Try a different search term.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
