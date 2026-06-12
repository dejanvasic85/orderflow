import { createServerFn } from "@tanstack/react-start";
import {
  fetchPagedProducts,
  fetchProduct,
  fetchProducts,
  insertProduct,
  patchProduct,
} from "./products.server";
import {
  createProductSchema,
  type ListProductsFilters,
  listProductsFiltersSchema,
  updateProductSchema,
} from "./schema";

export const listProducts = createServerFn({ method: "GET", strict: { output: false } }).handler(
  fetchProducts,
);

export const listPagedProducts = createServerFn({ method: "GET", strict: { output: false } })
  .validator((filters: ListProductsFilters = {}) => listProductsFiltersSchema.parse(filters))
  .handler(async ({ data }) => fetchPagedProducts(data));

export const getProduct = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => fetchProduct(id));

export const createProduct = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createProductSchema)
  .handler(async ({ data }) => insertProduct(data));

export const updateProduct = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateProductSchema)
  .handler(async ({ data }) => patchProduct(data));
