import { Heading, Text } from "react-email";
import { render } from "react-email";
import { EmailLayout } from "./EmailLayout";
import { ItemsTable } from "./ItemsTable";
import type { OrderEmailInput } from "./types";

type Props = OrderEmailInput;

function OrderPlacedStaff({ orderRef, accountName, placedByName, deliveryAddress, items }: Props) {
  return (
    <EmailLayout preview={`New order ${orderRef} — ${accountName}`}>
      <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 16px" }}>
        New order {orderRef}
      </Heading>
      <Text style={{ margin: "0 0 8px" }}>
        <strong>Account:</strong> {accountName}
      </Text>
      <Text style={{ margin: "0 0 8px" }}>
        <strong>Placed by:</strong> {placedByName}
      </Text>
      {deliveryAddress ? (
        <Text style={{ margin: "0 0 24px" }}>
          <strong>Delivery address:</strong> {deliveryAddress}
        </Text>
      ) : (
        <Text style={{ margin: "0 0 24px", color: "#6b7280" }}>No delivery address specified.</Text>
      )}
      <ItemsTable items={items} />
    </EmailLayout>
  );
}

export async function renderOrderPlacedStaff(input: OrderEmailInput) {
  return {
    subject: `New order ${input.orderRef} — ${input.accountName}`,
    html: await render(<OrderPlacedStaff {...input} />),
  };
}
