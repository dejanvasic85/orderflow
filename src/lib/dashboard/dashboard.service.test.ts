import { err, ok } from "@/lib/result";
import type { DashboardRepository, DashboardOrderRow } from "./dashboard.repository";
import {
  buildKpiSummary,
  buildOrderTimeSeries,
  buildRecentActivity,
  buildTopProducts,
  getDashboardData,
  itemBottleVolume,
  orderBottleVolume,
  type DashboardServiceDeps,
} from "./dashboard.service";

function makeRepo(overrides: Partial<DashboardRepository> = {}): DashboardRepository {
  return {
    findOrdersWithItemsSince: vi.fn().mockResolvedValue(ok([])),
    countActiveAccounts: vi.fn().mockResolvedValue(ok(0)),
    countActiveProducts: vi.fn().mockResolvedValue(ok(0)),
    ...overrides,
  };
}

function makeOrder(overrides: Partial<DashboardOrderRow> = {}): DashboardOrderRow {
  return {
    id: "order-1",
    order_number: 1,
    status: "submitted",
    created_at: "2026-06-01T10:00:00Z",
    account_id: "acc-1",
    placed_by: "user-1",
    order_request_items: [],
    accounts: { id: "acc-1", name: "Acme Wines" },
    users: { id: "user-1", name: "Tom Reynolds", role: "user" },
    ...overrides,
  };
}

const fixedNow = new Date("2026-06-20T12:00:00Z");

describe("itemBottleVolume", () => {
  it("calculates boxes times qty_per_box plus extra_bottles", () => {
    expect(
      itemBottleVolume({
        product_id: "p-1",
        boxes: 2,
        extra_bottles: 3,
        products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
      }),
    ).toBe(15);
  });

  it("treats null boxes as zero", () => {
    expect(
      itemBottleVolume({
        product_id: "p-1",
        boxes: null,
        extra_bottles: 4,
        products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
      }),
    ).toBe(4);
  });

  it("treats null extra_bottles as zero", () => {
    expect(
      itemBottleVolume({
        product_id: "p-1",
        boxes: 2,
        extra_bottles: null,
        products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
      }),
    ).toBe(12);
  });

  it("treats missing products join as zero qty_per_box", () => {
    expect(
      itemBottleVolume({ product_id: "p-1", boxes: 3, extra_bottles: 2, products: null }),
    ).toBe(2);
  });
});

describe("orderBottleVolume", () => {
  it("sums volumes across all items", () => {
    const row = makeOrder({
      order_request_items: [
        {
          product_id: "p-1",
          boxes: 2,
          extra_bottles: 0,
          products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
        },
        {
          product_id: "p-2",
          boxes: 1,
          extra_bottles: 3,
          products: { id: "p-2", name: "Pinot", qty_per_box: 12 },
        },
      ],
    });

    expect(orderBottleVolume(row)).toBe(27);
  });

  it("returns zero for an order with no items", () => {
    expect(orderBottleVolume(makeOrder({ order_request_items: [] }))).toBe(0);
  });
});

describe("buildKpiSummary", () => {
  it("returns all zeros for empty data", () => {
    const result = buildKpiSummary([], 0, 0, fixedNow);

    expect(result.totalOrders).toBe(0);
    expect(result.totalVolume).toBe(0);
    expect(result.activeAccounts).toBe(0);
    expect(result.activeProducts).toBe(0);
  });

  it("counts all rows as totalOrders and sums volume", () => {
    const rows = [
      makeOrder({
        created_at: "2026-06-10T00:00:00Z",
        order_request_items: [
          {
            product_id: "p-1",
            boxes: 2,
            extra_bottles: 0,
            products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
          },
        ],
      }),
      makeOrder({
        id: "order-2",
        created_at: "2026-06-12T00:00:00Z",
        order_request_items: [
          {
            product_id: "p-2",
            boxes: 1,
            extra_bottles: 0,
            products: { id: "p-2", name: "Pinot", qty_per_box: 12 },
          },
        ],
      }),
    ];

    const result = buildKpiSummary(rows, 5, 11, fixedNow);

    expect(result.totalOrders).toBe(2);
    expect(result.totalVolume).toBe(24);
    expect(result.activeAccounts).toBe(5);
    expect(result.activeProducts).toBe(11);
  });

  it("computes an up delta when current period has more orders than prior", () => {
    // current: [now-30d, now) = [May 21, June 20) — 3 orders
    // prior:   [now-60d, now-30d) = [Apr 21, May 21) — 1 order
    const rows = [
      makeOrder({ id: "o-1", created_at: "2026-06-10T00:00:00Z" }),
      makeOrder({ id: "o-2", created_at: "2026-06-05T00:00:00Z" }),
      makeOrder({ id: "o-3", created_at: "2026-05-25T00:00:00Z" }),
      makeOrder({ id: "o-4", created_at: "2026-04-30T00:00:00Z" }),
    ];

    const result = buildKpiSummary(rows, 5, 11, fixedNow);

    expect(result.totalOrdersDelta?.direction).toBe("up");
    expect(result.totalOrdersDelta?.changePct).toBeGreaterThan(0);
  });

  it("computes a flat delta when both periods are zero", () => {
    const result = buildKpiSummary([], 0, 0, fixedNow);

    expect(result.totalOrdersDelta?.direction).toBe("flat");
    expect(result.totalOrdersDelta?.changePct).toBe(0);
  });

  it("handles divide-by-zero when prior period has no orders", () => {
    // Only orders in current period
    const rows = [makeOrder({ created_at: "2026-06-10T00:00:00Z" })];

    const result = buildKpiSummary(rows, 0, 0, fixedNow);

    expect(result.totalOrdersDelta?.direction).toBe("up");
    expect(result.totalOrdersDelta?.changePct).toBe(100);
  });
});

describe("buildOrderTimeSeries", () => {
  it("returns a continuous zero-filled series of correct length for 7d", () => {
    const result = buildOrderTimeSeries([], "7d", fixedNow);

    expect(result).toHaveLength(7);
    expect(result.every((p) => p.count === 0)).toBe(true);
  });

  it("returns a continuous zero-filled series of correct length for 30d", () => {
    const result = buildOrderTimeSeries([], "30d", fixedNow);

    expect(result).toHaveLength(30);
  });

  it("increments count for orders on the same day", () => {
    const rows = [
      makeOrder({ id: "o-1", created_at: "2026-06-15T09:00:00Z" }),
      makeOrder({ id: "o-2", created_at: "2026-06-15T14:00:00Z" }),
    ];

    const result = buildOrderTimeSeries(rows, "30d", fixedNow);
    const bucket = result.find((p) => p.date === "2026-06-15");

    expect(bucket?.count).toBe(2);
  });

  it("excludes orders outside the window", () => {
    // 7d window: since = June 13 (fixedNow Jun 20 minus 7 days)
    const rows = [
      makeOrder({ id: "o-in", created_at: "2026-06-14T00:00:00Z" }),
      makeOrder({ id: "o-out", created_at: "2026-06-10T00:00:00Z" }),
    ];

    const result = buildOrderTimeSeries(rows, "7d", fixedNow);
    const total = result.reduce((sum, p) => sum + p.count, 0);

    expect(total).toBe(1);
  });

  it("returns series in ascending date order", () => {
    const result = buildOrderTimeSeries([], "30d", fixedNow);

    const dates = result.map((p) => p.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it("uses weekly buckets for 3m range", () => {
    const result = buildOrderTimeSeries([], "3m", fixedNow);

    // weekly buckets — fewer points than 90 days
    expect(result.length).toBeLessThan(90);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("buildTopProducts", () => {
  it("returns empty array when no rows", () => {
    expect(buildTopProducts([])).toEqual([]);
  });

  it("ranks products by descending bottle volume", () => {
    const rows = [
      makeOrder({
        order_request_items: [
          {
            product_id: "p-1",
            boxes: 1,
            extra_bottles: 0,
            products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
          },
          {
            product_id: "p-2",
            boxes: 2,
            extra_bottles: 0,
            products: { id: "p-2", name: "Pinot", qty_per_box: 12 },
          },
        ],
      }),
    ];

    const result = buildTopProducts(rows);

    expect(result[0].productId).toBe("p-2");
    expect(result[0].volume).toBe(24);
    expect(result[1].productId).toBe("p-1");
    expect(result[1].volume).toBe(6);
  });

  it("sums volumes for the same product across multiple orders", () => {
    const rows = [
      makeOrder({
        id: "o-1",
        order_request_items: [
          {
            product_id: "p-1",
            boxes: 1,
            extra_bottles: 0,
            products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
          },
        ],
      }),
      makeOrder({
        id: "o-2",
        order_request_items: [
          {
            product_id: "p-1",
            boxes: 2,
            extra_bottles: 0,
            products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
          },
        ],
      }),
    ];

    const result = buildTopProducts(rows);

    expect(result).toHaveLength(1);
    expect(result[0].volume).toBe(18);
  });

  it("breaks ties alphabetically by product name", () => {
    const rows = [
      makeOrder({
        order_request_items: [
          {
            product_id: "p-b",
            boxes: 1,
            extra_bottles: 0,
            products: { id: "p-b", name: "Zinfandel", qty_per_box: 6 },
          },
          {
            product_id: "p-a",
            boxes: 1,
            extra_bottles: 0,
            products: { id: "p-a", name: "Albariño", qty_per_box: 6 },
          },
        ],
      }),
    ];

    const result = buildTopProducts(rows);

    expect(result[0].name).toBe("Albariño");
    expect(result[1].name).toBe("Zinfandel");
  });

  it("limits results to the specified count", () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      product_id: `p-${i}`,
      boxes: 1,
      extra_bottles: 0,
      products: { id: `p-${i}`, name: `Product ${i}`, qty_per_box: 6 },
    }));
    const rows = [makeOrder({ order_request_items: items })];

    expect(buildTopProducts(rows, 5)).toHaveLength(5);
  });

  it("skips items with no products join", () => {
    const rows = [
      makeOrder({
        order_request_items: [{ product_id: "p-1", boxes: 2, extra_bottles: 0, products: null }],
      }),
    ];

    expect(buildTopProducts(rows)).toHaveLength(0);
  });
});

describe("buildRecentActivity", () => {
  it("returns empty array when no rows", () => {
    expect(buildRecentActivity([])).toEqual([]);
  });

  it("maps the order fields correctly", () => {
    const row = makeOrder({
      order_number: 7,
      status: "submitted",
      created_at: "2026-06-15T10:00:00Z",
      accounts: { id: "acc-1", name: "Acme Wines" },
      users: { id: "u-1", name: "Tom Reynolds", role: "user" },
      order_request_items: [
        {
          product_id: "p-1",
          boxes: 1,
          extra_bottles: 0,
          products: { id: "p-1", name: "Shiraz", qty_per_box: 6 },
        },
      ],
    });

    const [item] = buildRecentActivity([row]);

    expect(item.orderRef).toBe("ORD-0007");
    expect(item.accountName).toBe("Acme Wines");
    expect(item.placedByName).toBe("Tom Reynolds");
    expect(item.volume).toBe(6);
    expect(item.createdAt).toBe("2026-06-15T10:00:00Z");
  });

  it("masks admin and staff placed-by as bwow", () => {
    const adminRow = makeOrder({ users: { id: "u-1", name: "Jane Doe", role: "admin" } });
    const staffRow = makeOrder({
      id: "order-2",
      users: { id: "u-2", name: "Sarah", role: "staff" },
    });

    const [adminItem] = buildRecentActivity([adminRow]);
    const [staffItem] = buildRecentActivity([staffRow]);

    expect(adminItem.placedByName).toBe("bwow");
    expect(staffItem.placedByName).toBe("bwow");
  });

  it("falls back to Unknown when users join is null", () => {
    const row = makeOrder({ users: null });

    const [item] = buildRecentActivity([row]);

    expect(item.placedByName).toBe("Unknown");
  });

  it("uses Unknown for account when accounts join is null", () => {
    const row = makeOrder({ accounts: null });

    const [item] = buildRecentActivity([row]);

    expect(item.accountName).toBe("Unknown");
  });

  it("slices to the limit (default 8)", () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      makeOrder({ id: `order-${i}`, order_number: i + 1 }),
    );

    expect(buildRecentActivity(rows)).toHaveLength(8);
  });

  it("returns all rows when fewer than the limit", () => {
    const rows = [makeOrder(), makeOrder({ id: "order-2", order_number: 2 })];

    expect(buildRecentActivity(rows)).toHaveLength(2);
  });
});

describe("getDashboardData", () => {
  it("authorizes before fetching data", async () => {
    const authorize = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo();
    const deps: DashboardServiceDeps = { repo, authorize, now: () => fixedNow };

    await getDashboardData(deps);

    expect(authorize).toHaveBeenCalledTimes(1);
  });

  it("throws when authorization is rejected without calling the repo", async () => {
    const findOrdersWithItemsSince = vi.fn();
    const deps: DashboardServiceDeps = {
      repo: makeRepo({ findOrdersWithItemsSince }),
      authorize: vi.fn().mockRejectedValue(new Error("Forbidden")),
      now: () => fixedNow,
    };

    await expect(getDashboardData(deps)).rejects.toThrow("Forbidden");
    expect(findOrdersWithItemsSince).not.toHaveBeenCalled();
  });

  it("propagates a repository error from findOrdersWithItemsSince", async () => {
    const deps: DashboardServiceDeps = {
      repo: makeRepo({
        findOrdersWithItemsSince: vi.fn().mockResolvedValue(err({ message: "db error" })),
      }),
      authorize: vi.fn().mockResolvedValue(undefined),
      now: () => fixedNow,
    };

    const result = await getDashboardData(deps);

    expect(result).toEqual(err({ message: "db error" }));
  });

  it("propagates a repository error from countActiveAccounts", async () => {
    const deps: DashboardServiceDeps = {
      repo: makeRepo({
        countActiveAccounts: vi.fn().mockResolvedValue(err({ message: "accounts fail" })),
      }),
      authorize: vi.fn().mockResolvedValue(undefined),
      now: () => fixedNow,
    };

    const result = await getDashboardData(deps);

    expect(result).toEqual(err({ message: "accounts fail" }));
  });

  it("returns DashboardData with all three timeSeries keys", async () => {
    const deps: DashboardServiceDeps = {
      repo: makeRepo(),
      authorize: vi.fn().mockResolvedValue(undefined),
      now: () => fixedNow,
    };

    const result = await getDashboardData(deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.timeSeries).toHaveProperty("7d");
    expect(result.value.timeSeries).toHaveProperty("30d");
    expect(result.value.timeSeries).toHaveProperty("3m");
  });
});
