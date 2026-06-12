import { createServerFn } from "@tanstack/react-start";
import {
  fetchAllOrderHistory,
  fetchOrderRequest,
  fetchOrderRequestAsAdminOrStaff,
  fetchOrderHistoryForAccount,
  fetchOrderRequestsForAccount,
  insertOrderRequest,
  insertOrderRequestOnBehalf,
} from "./orderRequests.server";
import { createOrderRequestSchema, listOrdersSearchSchema, type ListOrdersSearch } from "./schema";

export const listOrderRequestsForAccount = createServerFn({
  method: "GET",
  strict: { output: false },
})
  .validator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => fetchOrderRequestsForAccount(accountId));

export const getOrderRequest = createServerFn({ method: "GET", strict: { output: false } })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => fetchOrderRequest(id));

export const createOrderRequest = createServerFn({ method: "POST", strict: { output: false } })
  .validator(createOrderRequestSchema)
  .handler(async ({ data }) => insertOrderRequest(data));

export const createOrderRequestOnBehalf = createServerFn({
  method: "POST",
  strict: { output: false },
})
  .validator(createOrderRequestSchema)
  .handler(async ({ data }) => insertOrderRequestOnBehalf(data));

export const listOrderHistory = createServerFn({ method: "GET", strict: { output: false } })
  .validator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => fetchOrderHistoryForAccount(accountId));

export const listAllOrders = createServerFn({ method: "GET", strict: { output: false } })
  .validator((filters: ListOrdersSearch = {}) => listOrdersSearchSchema.parse(filters))
  .handler(async ({ data: filters }) => fetchAllOrderHistory(filters));

export const getOrderRequestAsAdminOrStaff = createServerFn({
  method: "GET",
  strict: { output: false },
})
  .validator((id: string) => id)
  .handler(async ({ data: id }) => fetchOrderRequestAsAdminOrStaff(id));
