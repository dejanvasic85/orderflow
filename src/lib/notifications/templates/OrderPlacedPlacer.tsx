import { Heading, Text } from "react-email";
import { render } from "react-email";
import { EmailLayout } from "./EmailLayout";
import { ItemsTable } from "./ItemsTable";
import type { OrderEmailInput } from "./types";

type Props = OrderEmailInput;

function OrderPlacedPlacer({ orderRef, accountName, deliveryAddress, items }: Props) {
  return (
    <EmailLayout preview={`Your order ${orderRef} has been submitted`}>
      <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 16px" }}>
        Your order {orderRef} has been submitted
      </Heading>
      <Text style={{ margin: "0 0 8px" }}>
        <strong>Account:</strong> {accountName}
      </Text>
      {deliveryAddress && (
        <Text style={{ margin: "0 0 24px" }}>
          <strong>Delivery address:</strong> {deliveryAddress}
        </Text>
      )}
      <ItemsTable items={items} />
    </EmailLayout>
  );
}

export async function renderOrderPlacedPlacer(input: OrderEmailInput) {
  return {
    subject: `Your order ${input.orderRef} has been submitted`,
    html: await render(<OrderPlacedPlacer {...input} />),
  };
}
