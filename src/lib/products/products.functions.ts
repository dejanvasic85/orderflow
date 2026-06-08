import { createServerFn } from "@tanstack/react-start";
import { fetchProduct, fetchProducts, insertProduct, patchProduct } from "./products.server";
import { createProductSchema, updateProductSchema } from "./schema";

export const listProducts = createServerFn({ method: "GET", strict: { output: false } }).handler(
  fetchProducts,
);

export const getProduct = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => fetchProduct(id));

export const createProduct = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createProductSchema)
  .handler(async ({ data }) => insertProduct(data));

export const updateProduct = createServerFn({ method: "POST", strict: { output: false } })
  .validator(updateProductSchema)
  .handler(async ({ data }) => patchProduct(data));
