import { createServerFn } from "@tanstack/react-start";
import { assertAdmin, assertAdminOrStaff } from "@/lib/auth/auth.server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createProductRepository } from "./products.repository";
import {
  createProduct as createProductSvc,
  getProduct as getProductSvc,
  listActiveProducts as listActiveProductsSvc,
  listPagedProducts as listPagedProductsSvc,
  type ProductServiceDeps,
  updateProduct as updateProductSvc,
} from "./products.service";
import {
  createProductSchema,
  type ListProductsFilters,
  listProductsFiltersSchema,
  updateProductSchema,
} from "./schema";

const deps: ProductServiceDeps = {
  repo: createProductRepository(),
  authorize: () => assertAdminOrStaff(createSupabaseServerClient()),
  authorizeAdmin: () => assertAdmin(createSupabaseServerClient()),
};

export const listProducts = createServerFn({ method: "GET", strict: { output: false } }).handler(
  () => listActiveProductsSvc(deps),
);

export const listPagedProducts = createServerFn({ method: "GET", strict: { output: false } })
  .validator((filters: ListProductsFilters = {}) => listProductsFiltersSchema.parse(filters))
  .handler(async ({ data }) => listPagedProductsSvc(deps, data));

export const getProduct = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => getProductSvc(deps, id));

export const createProduct = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createProductSchema)
  .handler(async ({ data }) => createProductSvc(deps, data));

export const updateProduct = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateProductSchema)
  .handler(async ({ data }) => updateProductSvc(deps, data));
