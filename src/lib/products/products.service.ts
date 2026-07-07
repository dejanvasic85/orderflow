import type { Result } from "@/lib/result";
import type { ProductRepository } from "./products.repository";
import type {
  CreateProductInput,
  ListProductsFilters,
  Product,
  UpdateProductInput,
} from "./schema";

export type ProductServiceDeps = {
  repo: ProductRepository;
  authorize: () => Promise<void>;
  authorizeAdmin: () => Promise<void>;
};

export async function listActiveProducts(deps: ProductServiceDeps): Promise<Result<Product[]>> {
  return deps.repo.findActiveProducts();
}

export async function listPagedProducts(
  deps: ProductServiceDeps,
  filters: ListProductsFilters,
): Promise<Result<{ products: Product[]; total: number }>> {
  if (filters.includeInactive) await deps.authorize();
  return deps.repo.findPagedProducts(filters);
}

export async function getProduct(deps: ProductServiceDeps, id: string): Promise<Result<Product>> {
  return deps.repo.findProductById(id);
}

export async function createProduct(
  deps: ProductServiceDeps,
  data: CreateProductInput,
): Promise<Result<Product>> {
  await deps.authorizeAdmin();
  return deps.repo.createProduct(data);
}

export async function updateProduct(
  deps: ProductServiceDeps,
  data: UpdateProductInput,
): Promise<Result<Product>> {
  await deps.authorizeAdmin();
  return deps.repo.updateProduct(data);
}
