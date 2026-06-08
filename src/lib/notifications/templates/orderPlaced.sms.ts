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
  return `OrderFlow: ${orderRef} placed for ${accountName} by ${placedByName}.`;
}
