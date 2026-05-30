import type { OrderRequestItemInput } from "./schema";

const draftKey = (accountId: string) => `draft:${accountId}`;

export function loadDraft(accountId: string): OrderRequestItemInput[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(draftKey(accountId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as OrderRequestItemInput[];
  } catch {
    return [];
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
