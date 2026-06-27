import { err, ok } from "@/lib/result";
import type { OrderRequestRepository } from "./orderRequests.repository";
import {
  listAllOrderHistory,
  mapOrderHistoryRow,
  parseOrderHistorySearch,
  placeOrder,
  placeOrderOnBehalf,
  resolvePlacedByName,
  type OrderRequestServiceDeps,
} from "./orderRequests.service";

describe("resolvePlacedByName", () => {
  it("returns Unknown when there is no user", () => {
    expect(resolvePlacedByName(null)).toEqual({ placedByName: "Unknown" });
  });

  it("masks admins behind the bwow label", () => {
    expect(resolvePlacedByName({ id: "u-1", name: "Real Name", role: "admin" })).toEqual({
      placedByName: "bwow",
      placedByOrgName: "Boutique Wines of the World",
    });
  });

  it("masks staff behind the bwow label", () => {
    expect(resolvePlacedByName({ id: "u-1", name: "Real Name", role: "staff" })).toEqual({
      placedByName: "bwow",
      placedByOrgName: "Boutique Wines of the World",
    });
  });

  it("uses the real name for regular users", () => {
    expect(resolvePlacedByName({ id: "u-1", name: "Jane Smith", role: "user" })).toEqual({
      placedByName: "Jane Smith",
    });
  });

  it("falls back to Unknown when a user has an empty name", () => {
    expect(resolvePlacedByName({ id: "u-1", name: "", role: "user" })).toEqual({
      placedByName: "Unknown",
    });
  });
});

describe("mapOrderHistoryRow", () => {
  it("sums boxes and bottles and resolves the placed-by name", () => {
    const result = mapOrderHistoryRow({
      id: "order-1",
      order_number: 7,
      placed_by: "u-1",
      created_at: "2024-01-01T00:00:00Z",
      order_request_items: [
        { boxes: 2, extra_bottles: 1 },
        { boxes: 3, extra_bottles: 4 },
      ],
      users: { id: "u-1", name: "Jane Smith", role: "user" },
    });

    expect(result).toEqual({
      id: "order-1",
      order_number: 7,
      placed_by: "u-1",
      placedByName: "Jane Smith",
      created_at: "2024-01-01T00:00:00Z",
      total_boxes: 5,
      total_bottles: 5,
    });
  });

  it("includes the account name when an account is present", () => {
    const result = mapOrderHistoryRow({
      id: "order-1",
      order_number: 7,
      placed_by: "u-1",
      created_at: "2024-01-01T00:00:00Z",
      order_request_items: [],
      users: { id: "u-1", name: "Jane Smith", role: "user" },
      accounts: { id: "acc-1", name: "Acme Wines" },
    });

    expect(result.account_name).toBe("Acme Wines");
  });

  it("treats null box and bottle counts as zero", () => {
    const result = mapOrderHistoryRow({
      id: "order-1",
      order_number: 7,
      placed_by: "u-1",
      created_at: "2024-01-01T00:00:00Z",
      order_request_items: [{ boxes: null, extra_bottles: null }],
      users: null,
    });

    expect(result.total_boxes).toBe(0);
    expect(result.total_bottles).toBe(0);
  });
});

describe("parseOrderHistorySearch", () => {
  it("defaults to page 1 with no filters", () => {
    expect(parseOrderHistorySearch({})).toEqual({ kind: "all", page: 1 });
  });

  it("extracts the order number from a numeric query", () => {
    expect(parseOrderHistorySearch({ q: "ORD-0007", page: 2 })).toEqual({
      kind: "all",
      orderNumber: 7,
      page: 2,
    });
  });

  it("short-circuits to empty for a non-numeric query", () => {
    expect(parseOrderHistorySearch({ q: "no digits here" })).toEqual({ kind: "empty" });
  });
});

function makeRepo(overrides: Partial<OrderRequestRepository> = {}): OrderRequestRepository {
  return {
    findOrderRequestsForAccount: vi.fn(),
    findOrderRequestById: vi.fn(),
    findOrderHistoryForAccount: vi.fn(),
    findAllOrderHistory: vi.fn(),
    createOrderWithItems: vi.fn(),
    findAccountName: vi.fn().mockResolvedValue({ name: "Acme Wines" }),
    findPlacedByUser: vi.fn().mockResolvedValue({ id: "u-1", name: "Jane Smith", role: "user" }),
    findProductsByIds: vi.fn().mockResolvedValue([{ id: "p-1", name: "Shiraz" }]),
    ...overrides,
  };
}

const orderInput = {
  account_id: "acc-1",
  items: [{ product_id: "p-1", boxes: 2, extra_bottles: 1 }],
  delivery_address: "1 Vine St",
};

const fakeLog = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe("placeOrder", () => {
  it("creates the order with the session user's id", async () => {
    const createOrderWithItems = vi.fn().mockResolvedValue(ok({ id: "order-1", order_number: 7 }));
    const deps: OrderRequestServiceDeps = {
      repo: makeRepo({ createOrderWithItems }),
      session: vi.fn().mockResolvedValue({ id: "u-1" }),
      authorize: vi.fn(),
      notify: vi.fn().mockResolvedValue(undefined),
      log: fakeLog,
    };

    await placeOrder(deps, orderInput);

    expect(createOrderWithItems).toHaveBeenCalledWith(orderInput, "u-1");
  });

  it("logs order.placed created on success", async () => {
    const deps: OrderRequestServiceDeps = {
      repo: makeRepo({
        createOrderWithItems: vi.fn().mockResolvedValue(ok({ id: "order-1", order_number: 7 })),
      }),
      session: vi.fn().mockResolvedValue({ id: "u-1" }),
      authorize: vi.fn(),
      notify: vi.fn().mockResolvedValue(undefined),
      log: fakeLog,
    };

    await placeOrder(deps, orderInput);

    expect(fakeLog.info).toHaveBeenCalledWith("order.placed", "created", {
      orderId: "order-1",
      userId: "u-1",
      accountId: "acc-1",
    });
  });

  it("logs order.placed failed and does not notify when the write fails", async () => {
    const repo = makeRepo({
      createOrderWithItems: vi.fn().mockResolvedValue(err({ message: "insert failed" })),
    });
    const notify = vi.fn();
    const deps: OrderRequestServiceDeps = {
      repo,
      session: vi.fn().mockResolvedValue({ id: "u-1" }),
      authorize: vi.fn(),
      notify,
      log: fakeLog,
    };

    const result = await placeOrder(deps, orderInput);

    expect(result).toEqual(err({ message: "insert failed" }));
    expect(notify).not.toHaveBeenCalled();
    expect(fakeLog.warn).toHaveBeenCalledWith("order.placed", "failed", { userId: "u-1" });
  });

  it("notifies with the resolved order details after a successful write", async () => {
    const repo = makeRepo({
      createOrderWithItems: vi.fn().mockResolvedValue(ok({ id: "order-1", order_number: 7 })),
    });
    const notify = vi.fn().mockResolvedValue(undefined);
    const deps: OrderRequestServiceDeps = {
      repo,
      session: vi.fn().mockResolvedValue({ id: "u-1" }),
      authorize: vi.fn(),
      notify,
      log: fakeLog,
    };

    await placeOrder(deps, orderInput);

    expect(notify).toHaveBeenCalledWith({
      orderId: "order-1",
      orderRef: "ORD-0007",
      accountId: "acc-1",
      placedById: "u-1",
      accountName: "Acme Wines",
      placedByName: "Jane Smith",
      deliveryAddress: "1 Vine St",
      items: [{ productName: "Shiraz", boxes: 2, extraBottles: 1 }],
    });
  });
});

describe("placeOrderOnBehalf", () => {
  it("authorizes before placing the order", async () => {
    const createOrderWithItems = vi.fn().mockResolvedValue(ok({ id: "order-1", order_number: 7 }));
    const authorize = vi.fn().mockResolvedValue(undefined);
    const deps: OrderRequestServiceDeps = {
      repo: makeRepo({ createOrderWithItems }),
      session: vi.fn().mockResolvedValue({ id: "u-1" }),
      authorize,
      notify: vi.fn().mockResolvedValue(undefined),
      log: fakeLog,
    };

    await placeOrderOnBehalf(deps, orderInput);

    expect(authorize).toHaveBeenCalledTimes(1);
    expect(createOrderWithItems).toHaveBeenCalledWith(orderInput, "u-1");
  });

  it("logs on behalf info when placing on behalf", async () => {
    const deps: OrderRequestServiceDeps = {
      repo: makeRepo({
        createOrderWithItems: vi.fn().mockResolvedValue(ok({ id: "order-1", order_number: 7 })),
      }),
      session: vi.fn().mockResolvedValue({ id: "u-1" }),
      authorize: vi.fn().mockResolvedValue(undefined),
      notify: vi.fn().mockResolvedValue(undefined),
      log: fakeLog,
    };

    await placeOrderOnBehalf(deps, orderInput);

    expect(fakeLog.info).toHaveBeenCalledWith("order.placed", "on behalf", { actorId: "u-1" });
  });

  it("does not place the order when authorization throws", async () => {
    const createOrderWithItems = vi.fn();
    const deps: OrderRequestServiceDeps = {
      repo: makeRepo({ createOrderWithItems }),
      session: vi.fn(),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
      notify: vi.fn(),
      log: fakeLog,
    };

    await expect(placeOrderOnBehalf(deps, orderInput)).rejects.toThrow("Forbidden");
    expect(createOrderWithItems).not.toHaveBeenCalled();
  });
});

describe("listAllOrderHistory", () => {
  it("returns an empty result without querying for a non-numeric search", async () => {
    const findAllOrderHistory = vi.fn();
    const deps: OrderRequestServiceDeps = {
      repo: makeRepo({ findAllOrderHistory }),
      session: vi.fn(),
      authorize: vi.fn().mockResolvedValue(undefined),
      notify: vi.fn(),
      log: fakeLog,
    };

    const result = await listAllOrderHistory(deps, { q: "no digits" });

    expect(result).toEqual(ok({ orders: [], total: 0 }));
    expect(findAllOrderHistory).not.toHaveBeenCalled();
  });

  it("maps the repository rows into order history items", async () => {
    const repo = makeRepo({
      findAllOrderHistory: vi.fn().mockResolvedValue(
        ok({
          rows: [
            {
              id: "order-1",
              order_number: 7,
              placed_by: "u-1",
              created_at: "2024-01-01T00:00:00Z",
              order_request_items: [{ boxes: 2, extra_bottles: 1 }],
              users: { id: "u-1", name: "Jane Smith", role: "user" },
            },
          ],
          total: 1,
        }),
      ),
    });
    const deps: OrderRequestServiceDeps = {
      repo,
      session: vi.fn(),
      authorize: vi.fn().mockResolvedValue(undefined),
      notify: vi.fn(),
      log: fakeLog,
    };

    const result = await listAllOrderHistory(deps, {});

    expect(result).toEqual(
      ok({
        orders: [
          {
            id: "order-1",
            order_number: 7,
            placed_by: "u-1",
            placedByName: "Jane Smith",
            created_at: "2024-01-01T00:00:00Z",
            total_boxes: 2,
            total_bottles: 1,
          },
        ],
        total: 1,
      }),
    );
  });

  it("propagates a repository error", async () => {
    const repo = makeRepo({
      findAllOrderHistory: vi.fn().mockResolvedValue(err({ message: "db down" })),
    });
    const deps: OrderRequestServiceDeps = {
      repo,
      session: vi.fn(),
      authorize: vi.fn().mockResolvedValue(undefined),
      notify: vi.fn(),
      log: fakeLog,
    };

    const result = await listAllOrderHistory(deps, {});

    expect(result).toEqual(err({ message: "db down" }));
  });
});
