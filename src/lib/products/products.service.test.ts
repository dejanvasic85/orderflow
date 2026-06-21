import { err, ok } from "@/lib/result";
import type { ProductRepository } from "./products.repository";
import {
  createProduct,
  getProduct,
  listActiveProducts,
  listPagedProducts,
  type ProductServiceDeps,
  updateProduct,
} from "./products.service";

function makeRepo(overrides: Partial<ProductRepository> = {}): ProductRepository {
  return {
    findActiveProducts: vi.fn().mockResolvedValue(ok([])),
    findPagedProducts: vi.fn().mockResolvedValue(ok({ products: [], total: 0 })),
    findProductById: vi.fn().mockResolvedValue(ok({ id: "p-1", name: "Wine" })),
    createProduct: vi.fn().mockResolvedValue(ok({ id: "p-new", name: "New Wine" })),
    updateProduct: vi.fn().mockResolvedValue(ok({ id: "p-1", name: "Updated Wine" })),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<ProductServiceDeps> = {}): ProductServiceDeps {
  return {
    repo: makeRepo(),
    authorize: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("listActiveProducts", () => {
  it("delegates directly to repo without calling authorize", async () => {
    const authorize = vi.fn();
    const findActiveProducts = vi.fn().mockResolvedValue(ok([{ id: "p-1" }]));
    const deps = makeDeps({ repo: makeRepo({ findActiveProducts }), authorize });

    const result = await listActiveProducts(deps);

    expect(result).toEqual(ok([{ id: "p-1" }]));
    expect(authorize).not.toHaveBeenCalled();
    expect(findActiveProducts).toHaveBeenCalledTimes(1);
  });

  it("propagates a repo error", async () => {
    const findActiveProducts = vi.fn().mockResolvedValue(err({ message: "db error" }));
    const deps = makeDeps({ repo: makeRepo({ findActiveProducts }) });

    const result = await listActiveProducts(deps);

    expect(result).toEqual(err({ message: "db error" }));
  });
});

describe("listPagedProducts", () => {
  it("calls authorize before querying when includeInactive is true", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const findPagedProducts = vi.fn().mockResolvedValue(ok({ products: [], total: 0 }));
    const deps = makeDeps({ repo: makeRepo({ findPagedProducts }), authorize });

    await listPagedProducts(deps, { includeInactive: true, page: 1 });

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(findPagedProducts).toHaveBeenCalledTimes(1);
  });

  it("does not call authorize when includeInactive is false", async () => {
    const authorize = vi.fn();
    const deps = makeDeps({ authorize });

    await listPagedProducts(deps, { includeInactive: false, page: 1 });

    expect(authorize).not.toHaveBeenCalled();
  });

  it("does not call authorize when includeInactive is absent", async () => {
    const authorize = vi.fn();
    const deps = makeDeps({ authorize });

    await listPagedProducts(deps, { page: 1 });

    expect(authorize).not.toHaveBeenCalled();
  });

  it("throws without calling repo when authorize rejects", async () => {
    const findPagedProducts = vi.fn();
    const deps = makeDeps({
      repo: makeRepo({ findPagedProducts }),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
    });

    await expect(listPagedProducts(deps, { includeInactive: true })).rejects.toThrow("Forbidden");
    expect(findPagedProducts).not.toHaveBeenCalled();
  });

  it("propagates a repo error", async () => {
    const findPagedProducts = vi.fn().mockResolvedValue(err({ message: "db error" }));
    const deps = makeDeps({ repo: makeRepo({ findPagedProducts }) });

    const result = await listPagedProducts(deps, { page: 1 });

    expect(result).toEqual(err({ message: "db error" }));
  });
});

describe("getProduct", () => {
  it("delegates to repo.findProductById with the correct id", async () => {
    const findProductById = vi.fn().mockResolvedValue(ok({ id: "p-42", name: "Pinot Noir" }));
    const deps = makeDeps({ repo: makeRepo({ findProductById }) });

    const result = await getProduct(deps, "p-42");

    expect(result).toEqual(ok({ id: "p-42", name: "Pinot Noir" }));
    expect(findProductById).toHaveBeenCalledWith("p-42");
  });

  it("propagates a repo error", async () => {
    const findProductById = vi.fn().mockResolvedValue(err({ message: "not found" }));
    const deps = makeDeps({ repo: makeRepo({ findProductById }) });

    const result = await getProduct(deps, "p-99");

    expect(result).toEqual(err({ message: "not found" }));
  });
});

describe("createProduct", () => {
  it("delegates to repo.createProduct and returns the created row", async () => {
    const newProduct = { id: "p-new", name: "Shiraz", qty_per_box: 6 } as never;
    const createProductFn = vi.fn().mockResolvedValue(ok(newProduct));
    const deps = makeDeps({ repo: makeRepo({ createProduct: createProductFn }) });
    const input = { name: "Shiraz", qty_per_box: 6 };

    const result = await createProduct(deps, input);

    expect(result).toEqual(ok(newProduct));
    expect(createProductFn).toHaveBeenCalledWith(input);
  });
});

describe("updateProduct", () => {
  it("delegates to repo.updateProduct and returns the updated row", async () => {
    const updated = { id: "p-1", name: "Shiraz Reserve", qty_per_box: 12 } as never;
    const updateProductFn = vi.fn().mockResolvedValue(ok(updated));
    const deps = makeDeps({ repo: makeRepo({ updateProduct: updateProductFn }) });
    const input = { id: "p-1", name: "Shiraz Reserve" };

    const result = await updateProduct(deps, input);

    expect(result).toEqual(ok(updated));
    expect(updateProductFn).toHaveBeenCalledWith(input);
  });
});
