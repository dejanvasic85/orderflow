import { createServerFn } from "@tanstack/react-start";
import {
  fetchOrderRequest,
  fetchOrderRequestsForAccount,
  insertOrderRequest,
} from "./orderRequests.server";
import { createOrderRequestSchema } from "./schema";

export const listOrderRequestsForAccount = createServerFn({
  method: "GET",
  strict: { output: false },
})
  .inputValidator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => fetchOrderRequestsForAccount(accountId));

export const getOrderRequest = createServerFn({ method: "GET", strict: { output: false } })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => fetchOrderRequest(id));

export const createOrderRequest = createServerFn({ method: "POST", strict: { output: false } })
  .inputValidator(createOrderRequestSchema)
  .handler(async ({ data }) => insertOrderRequest(data));
