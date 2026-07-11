import { err, ok } from "@/lib/result";
import { makeDashboardOrder } from "@/test/fixtures/dashboardFixtures";
import type { DashboardRepository } from "./dashboard.repository";
import {
  buildKpiSummary,
  buildOrderTimeSeries,
  buildRecentActivity,
  buildTopProducts,
  getDashboardData,
  itemUnitVolume,
  orderUnitVolume,
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

const fixedNow = new Date("2026-06-20T12:00:00Z");

describe("itemUnitVolume", () => {
  it("calculates boxes times qtyPerBox plus extraUnits", () => {
    expect(
      itemUnitVolume({
        productId: "p-1",
        boxes: 2,
        extraUnits: 3,
        product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
      }),
    ).toBe(15);
  });

  it("treats null boxes as zero", () => {
    expect(
      itemUnitVolume({
        productId: "p-1",
        boxes: null,
        extraUnits: 4,
        product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
      }),
    ).toBe(4);
  });

  it("treats null extraUnits as zero", () => {
    expect(
      itemUnitVolume({
        productId: "p-1",
        boxes: 2,
        extraUnits: null,
        product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
      }),
    ).toBe(12);
  });

  it("treats missing product join as zero qtyPerBox", () => {
    expect(itemUnitVolume({ productId: "p-1", boxes: 3, extraUnits: 2, product: null })).toBe(2);
  });
});

describe("orderUnitVolume", () => {
  it("sums volumes across all items", () => {
    const order = makeDashboardOrder({
      items: [
        {
          productId: "p-1",
          boxes: 2,
          extraUnits: 0,
          product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
        },
        {
          productId: "p-2",
          boxes: 1,
          extraUnits: 3,
          product: { id: "p-2", name: "Pinot", qtyPerBox: 12 },
        },
      ],
    });

    expect(orderUnitVolume(order)).toBe(27);
  });

  it("returns zero for an order with no items", () => {
    expect(orderUnitVolume(makeDashboardOrder({ items: [] }))).toBe(0);
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

  it("counts all orders as totalOrders and sums volume", () => {
    const orders = [
      makeDashboardOrder({
        createdAt: "2026-06-10T00:00:00Z",
        items: [
          {
            productId: "p-1",
            boxes: 2,
            extraUnits: 0,
            product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
          },
        ],
      }),
      makeDashboardOrder({
        id: "order-2",
        createdAt: "2026-06-12T00:00:00Z",
        items: [
          {
            productId: "p-2",
            boxes: 1,
            extraUnits: 0,
            product: { id: "p-2", name: "Pinot", qtyPerBox: 12 },
          },
        ],
      }),
    ];

    const result = buildKpiSummary(orders, 5, 11, fixedNow);

    expect(result.totalOrders).toBe(2);
    expect(result.totalVolume).toBe(24);
    expect(result.activeAccounts).toBe(5);
    expect(result.activeProducts).toBe(11);
  });

  it("computes an up delta when current period has more orders than prior", () => {
    // current: [now-30d, now) = [May 21, June 20) — 3 orders
    // prior:   [now-60d, now-30d) = [Apr 21, May 21) — 1 order
    const orders = [
      makeDashboardOrder({ id: "o-1", createdAt: "2026-06-10T00:00:00Z" }),
      makeDashboardOrder({ id: "o-2", createdAt: "2026-06-05T00:00:00Z" }),
      makeDashboardOrder({ id: "o-3", createdAt: "2026-05-25T00:00:00Z" }),
      makeDashboardOrder({ id: "o-4", createdAt: "2026-04-30T00:00:00Z" }),
    ];

    const result = buildKpiSummary(orders, 5, 11, fixedNow);

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
    const orders = [makeDashboardOrder({ createdAt: "2026-06-10T00:00:00Z" })];

    const result = buildKpiSummary(orders, 0, 0, fixedNow);

    expect(result.totalOrdersDelta?.direction).toBe("up");
    expect(result.totalOrdersDelta?.changePct).toBe(100);
  });
});

describe("buildOrderTimeSeries", () => {
  it("returns a continuous zero-filled series of correct length for 7d", () => {
    const result = buildOrderTimeSeries([], "7d", fixedNow);

    expect(result).toHaveLength(8);
    expect(result.every((p) => p.count === 0)).toBe(true);
  });

  it("returns a continuous zero-filled series of correct length for 30d", () => {
    const result = buildOrderTimeSeries([], "30d", fixedNow);

    expect(result).toHaveLength(31);
  });

  it("increments count for orders on the same day", () => {
    const orders = [
      makeDashboardOrder({ id: "o-1", createdAt: "2026-06-15T09:00:00Z" }),
      makeDashboardOrder({ id: "o-2", createdAt: "2026-06-15T14:00:00Z" }),
    ];

    const result = buildOrderTimeSeries(orders, "30d", fixedNow);
    const bucket = result.find((p) => p.date === "2026-06-15");

    expect(bucket?.count).toBe(2);
  });

  it("includes orders placed today (the last bucket)", () => {
    const orders = [makeDashboardOrder({ id: "o-today", createdAt: "2026-06-20T08:00:00Z" })];

    const result = buildOrderTimeSeries(orders, "30d", fixedNow);
    const todayBucket = result.find((p) => p.date === "2026-06-20");

    expect(todayBucket?.count).toBe(1);
  });

  it("excludes orders outside the window", () => {
    // 7d window: since = June 13 (fixedNow Jun 20 minus 7 days)
    const orders = [
      makeDashboardOrder({ id: "o-in", createdAt: "2026-06-14T00:00:00Z" }),
      makeDashboardOrder({ id: "o-out", createdAt: "2026-06-10T00:00:00Z" }),
    ];

    const result = buildOrderTimeSeries(orders, "7d", fixedNow);
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
  it("returns empty array when no orders", () => {
    expect(buildTopProducts([])).toEqual([]);
  });

  it("ranks products by descending unit volume", () => {
    const orders = [
      makeDashboardOrder({
        items: [
          {
            productId: "p-1",
            boxes: 1,
            extraUnits: 0,
            product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
          },
          {
            productId: "p-2",
            boxes: 2,
            extraUnits: 0,
            product: { id: "p-2", name: "Pinot", qtyPerBox: 12 },
          },
        ],
      }),
    ];

    const result = buildTopProducts(orders);

    expect(result[0].productId).toBe("p-2");
    expect(result[0].volume).toBe(24);
    expect(result[1].productId).toBe("p-1");
    expect(result[1].volume).toBe(6);
  });

  it("sums volumes for the same product across multiple orders", () => {
    const orders = [
      makeDashboardOrder({
        id: "o-1",
        items: [
          {
            productId: "p-1",
            boxes: 1,
            extraUnits: 0,
            product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
          },
        ],
      }),
      makeDashboardOrder({
        id: "o-2",
        items: [
          {
            productId: "p-1",
            boxes: 2,
            extraUnits: 0,
            product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
          },
        ],
      }),
    ];

    const result = buildTopProducts(orders);

    expect(result).toHaveLength(1);
    expect(result[0].volume).toBe(18);
  });

  it("breaks ties alphabetically by product name", () => {
    const orders = [
      makeDashboardOrder({
        items: [
          {
            productId: "p-b",
            boxes: 1,
            extraUnits: 0,
            product: { id: "p-b", name: "Zinfandel", qtyPerBox: 6 },
          },
          {
            productId: "p-a",
            boxes: 1,
            extraUnits: 0,
            product: { id: "p-a", name: "Albariño", qtyPerBox: 6 },
          },
        ],
      }),
    ];

    const result = buildTopProducts(orders);

    expect(result[0].name).toBe("Albariño");
    expect(result[1].name).toBe("Zinfandel");
  });

  it("limits results to the specified count", () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      productId: `p-${i}`,
      boxes: 1,
      extraUnits: 0,
      product: { id: `p-${i}`, name: `Product ${i}`, qtyPerBox: 6 },
    }));
    const orders = [makeDashboardOrder({ items })];

    expect(buildTopProducts(orders, 5)).toHaveLength(5);
  });

  it("skips items with no product join", () => {
    const orders = [
      makeDashboardOrder({
        items: [{ productId: "p-1", boxes: 2, extraUnits: 0, product: null }],
      }),
    ];

    expect(buildTopProducts(orders)).toHaveLength(0);
  });
});

describe("buildRecentActivity", () => {
  it("returns empty array when no orders", () => {
    expect(buildRecentActivity([])).toEqual([]);
  });

  it("maps the order fields correctly", () => {
    const order = makeDashboardOrder({
      orderNumber: 7,
      createdAt: "2026-06-15T10:00:00Z",
      account: { id: "acc-1", name: "Acme Wines" },
      user: { id: "u-1", name: "Tom Reynolds", role: "user" },
      items: [
        {
          productId: "p-1",
          boxes: 1,
          extraUnits: 0,
          product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
        },
      ],
    });

    const [item] = buildRecentActivity([order]);

    expect(item.orderRef).toBe("ORD-0007");
    expect(item.accountName).toBe("Acme Wines");
    expect(item.placedByName).toBe("Tom Reynolds");
    expect(item.volume).toBe(6);
    expect(item.createdAt).toBe("2026-06-15T10:00:00Z");
  });

  it("masks admin and staff placed-by as bwow", () => {
    const adminOrder = makeDashboardOrder({ user: { id: "u-1", name: "Jane Doe", role: "admin" } });
    const staffOrder = makeDashboardOrder({
      id: "order-2",
      user: { id: "u-2", name: "Sarah", role: "staff" },
    });

    const [adminItem] = buildRecentActivity([adminOrder]);
    const [staffItem] = buildRecentActivity([staffOrder]);

    expect(adminItem.placedByName).toBe("bwow");
    expect(staffItem.placedByName).toBe("bwow");
  });

  it("falls back to Unknown when user join is null", () => {
    const order = makeDashboardOrder({ user: null });

    const [item] = buildRecentActivity([order]);

    expect(item.placedByName).toBe("Unknown");
  });

  it("uses Unknown for account when account join is null", () => {
    const order = makeDashboardOrder({ account: null });

    const [item] = buildRecentActivity([order]);

    expect(item.accountName).toBe("Unknown");
  });

  it("slices to the limit (default 8)", () => {
    const orders = Array.from({ length: 12 }, (_, i) =>
      makeDashboardOrder({ id: `order-${i}`, orderNumber: i + 1 }),
    );

    expect(buildRecentActivity(orders)).toHaveLength(8);
  });

  it("returns all orders when fewer than the limit", () => {
    const orders = [makeDashboardOrder(), makeDashboardOrder({ id: "order-2", orderNumber: 2 })];

    expect(buildRecentActivity(orders)).toHaveLength(2);
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
