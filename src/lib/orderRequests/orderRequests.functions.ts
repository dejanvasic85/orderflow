import { createServerFn } from "@tanstack/react-start";
import { fetchSessionOrThrow } from "@/lib/auth/auth.server";
import { assertAdminOrStaff } from "@/lib/auth/auth.server";
import { log } from "@/lib/log/logger";
import { notifyOrderPlaced } from "@/lib/notifications/notifications.server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createOrderRequestRepository } from "./orderRequests.repository";
import {
  getOrderRequest as getOrderRequestSvc,
  getOrderRequestAsAdminOrStaff as getOrderRequestAsAdminOrStaffSvc,
  listAllOrderHistory as listAllOrderHistorySvc,
  listOrderHistoryForAccount as listOrderHistoryForAccountSvc,
  listOrderRequestsForAccount as listOrderRequestsForAccountSvc,
  placeOrder,
  placeOrderOnBehalf,
  type OrderRequestServiceDeps,
} from "./orderRequests.service";
import { createOrderRequestSchema, listOrdersSearchSchema, type ListOrdersSearch } from "./schema";

const deps: OrderRequestServiceDeps = {
  repo: createOrderRequestRepository(),
  session: fetchSessionOrThrow,
  authorize: () => assertAdminOrStaff(createSupabaseServerClient()),
  notify: notifyOrderPlaced,
  log,
};

export const listOrderRequestsForAccount = createServerFn({
  method: "GET",
  strict: { output: false },
})
  .validator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => listOrderRequestsForAccountSvc(deps, accountId));

export const getOrderRequest = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => getOrderRequestSvc(deps, id));

export const createOrderRequest = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createOrderRequestSchema)
  .handler(async ({ data }) => placeOrder(deps, data));

export const createOrderRequestOnBehalf = createServerFn({
  method: "POST",
  strict: { output: false },
})
  .validator(createOrderRequestSchema)
  .handler(async ({ data }) => placeOrderOnBehalf(deps, data));

export const listOrderHistory = createServerFn({ method: "GET", strict: { output: false } })
  .validator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => listOrderHistoryForAccountSvc(deps, accountId));

export const listAllOrders = createServerFn({ method: "GET", strict: { output: false } })
  .validator((filters: ListOrdersSearch = {}) => listOrdersSearchSchema.parse(filters))
  .handler(async ({ data: filters }) => listAllOrderHistorySvc(deps, filters));

export const getOrderRequestAsAdminOrStaff = createServerFn({
  method: "GET",
  strict: { output: false },
})
  .validator((id: string) => id)
  .handler(async ({ data: id }) => getOrderRequestAsAdminOrStaffSvc(deps, id));
