import type { OrderRequestItemInput } from "./schema";

const draftKey = (accountId: string) => `draft:${accountId}`;

export function loadDraft(accountId: string): OrderRequestItemInput[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(accountId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as OrderRequestItemInput[];
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
