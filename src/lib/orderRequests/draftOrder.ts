import { z } from "zod";
import type { OrderRequestItemInput } from "./schema";

const draftKey = (accountId: string) => `draft:${accountId}`;

const draftItemSchema = z.object({
  productId: z.string(),
  boxes: z.number().int().min(0),
  extraUnits: z.number().int().min(0),
}) satisfies z.ZodType<OrderRequestItemInput>;

export function loadDraft(accountId: string): OrderRequestItemInput[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(accountId));
    if (!raw) return null;
    const parsed = draftItemSchema.array().safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveDraft(accountId: string, items: OrderRequestItemInput[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(draftKey(accountId), JSON.stringify(items));
}

export function clearDraft(accountId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftKey(accountId));
}
