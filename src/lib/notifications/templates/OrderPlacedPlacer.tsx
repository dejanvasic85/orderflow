import { Button, Heading, Text } from "react-email";
import { render } from "react-email";
import { EmailLayout } from "./EmailLayout";
import { ItemsTable } from "./ItemsTable";
import type { OrderEmailInput } from "./types";

type Props = OrderEmailInput;

function OrderPlacedPlacer({ orderRef, accountName, deliveryAddress, items, orderUrl }: Props) {
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
      <Button
        href={orderUrl}
        style={{
          backgroundColor: "#1e3a5f",
          borderRadius: "6px",
          color: "#ffffff",
          display: "inline-block",
          fontSize: "14px",
          fontWeight: "600",
          marginTop: "24px",
          padding: "12px 24px",
          textDecoration: "none",
        }}
      >
        View order
      </Button>
    </EmailLayout>
  );
}

export async function renderOrderPlacedPlacer(input: OrderEmailInput) {
  return {
    subject: `Your order ${input.orderRef} has been submitted`,
    html: await render(<OrderPlacedPlacer {...input} />),
  };
}
