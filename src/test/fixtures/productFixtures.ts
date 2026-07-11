import type { OrderRequestItem } from "@/lib/orderRequests/schema";
import type { Product } from "@/lib/products/schema";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p-1",
    name: "Shiraz",
    imageUrl: null,
    qtyPerBox: 6,
    active: true,
    externalId: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// The abbreviated product embed carried on order request items.
type ProductRef = OrderRequestItem["product"];

export function makeProductRef(overrides: Partial<ProductRef> = {}): ProductRef {
  return {
    id: "p-1",
    name: "Shiraz",
    qtyPerBox: 6,
    imageUrl: null,
    ...overrides,
  };
}
