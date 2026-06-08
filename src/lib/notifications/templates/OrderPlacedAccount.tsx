import { Heading, Text } from "react-email";
import { render } from "react-email";
import { EmailLayout } from "./EmailLayout";
import { ItemsTable } from "./ItemsTable";
import type { OrderEmailInput } from "./types";

type Props = OrderEmailInput;

function OrderPlacedAccount({
  orderRef,
  accountName,
  placedByName,
  deliveryAddress,
  items,
}: Props) {
  return (
    <EmailLayout preview={`Order ${orderRef} placed for ${accountName}`}>
      <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 16px" }}>
        Order {orderRef} placed for your account
      </Heading>
      <Text style={{ margin: "0 0 8px" }}>
        <strong>Account:</strong> {accountName}
      </Text>
      <Text style={{ margin: "0 0 24px" }}>
        <strong>Placed by:</strong> {placedByName}
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

export async function renderOrderPlacedAccount(input: OrderEmailInput) {
  return {
    subject: `Order ${input.orderRef} placed for ${input.accountName}`,
    html: await render(<OrderPlacedAccount {...input} />),
  };
}
