import { company } from "@/lib/config";

type OrderPlacedSmsInput = {
  orderRef: string;
  accountName: string;
  placedByName: string;
  orderUrl: string;
};

export function renderOrderPlacedSms({
  orderRef,
  accountName,
  placedByName,
  orderUrl,
}: OrderPlacedSmsInput): string {
  return `${company.shortName}: ${orderRef} placed for ${accountName} by ${placedByName}. ${orderUrl}`;
}
