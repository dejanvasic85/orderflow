import { company } from "@/lib/config";

type OrderPlacedSmsInput = {
  orderRef: string;
  accountName: string;
  placedByName: string;
};

export function renderOrderPlacedSms({
  orderRef,
  accountName,
  placedByName,
}: OrderPlacedSmsInput): string {
  return `${company.shortName}: ${orderRef} placed for ${accountName} by ${placedByName}.`;
}
