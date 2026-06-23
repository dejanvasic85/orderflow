import type { Result } from "@/lib/result";
import type { ProductRepository } from "./products.repository";
import type {
  CreateProductInput,
  ListProductsFilters,
  ProductRow,
  UpdateProductInput,
} from "./schema";

export type ProductServiceDeps = {
  repo: ProductRepository;
  authorize: () => Promise<void>;
  authorizeAdmin: () => Promise<void>;
};

export async function listActiveProducts(deps: ProductServiceDeps): Promise<Result<ProductRow[]>> {
  return deps.repo.findActiveProducts();
}

export async function listPagedProducts(
  deps: ProductServiceDeps,
  filters: ListProductsFilters,
): Promise<Result<{ products: ProductRow[]; total: number }>> {
  if (filters.includeInactive) await deps.authorize();
  return deps.repo.findPagedProducts(filters);
}

export async function getProduct(
  deps: ProductServiceDeps,
  id: string,
): Promise<Result<ProductRow>> {
  return deps.repo.findProductById(id);
}

export async function createProduct(
  deps: ProductServiceDeps,
  data: CreateProductInput,
): Promise<Result<ProductRow>> {
  await deps.authorizeAdmin();
  return deps.repo.createProduct(data);
}

export async function updateProduct(
  deps: ProductServiceDeps,
  data: UpdateProductInput,
): Promise<Result<ProductRow>> {
  await deps.authorizeAdmin();
  return deps.repo.updateProduct(data);
}
