import { render, screen } from "@testing-library/react";
import { makeOrderRequestItem, makeOrderRequestWithItems } from "@/test/fixtures/orderFixtures";
import { OrderDetailsView } from "./OrderDetailsView";

const baseOrder = makeOrderRequestWithItems({
  id: "11111111-1111-4111-8111-111111111111",
  orderNumber: 42,
  accountId: "22222222-2222-4222-8222-222222222222",
  placedBy: "33333333-3333-4333-8333-333333333333",
  createdAt: "2026-06-29T09:00:00.000Z",
  updatedAt: "2026-06-29T09:00:00.000Z",
  orderRequestItems: [
    makeOrderRequestItem({
      id: "44444444-4444-4444-8444-444444444444",
      productId: "55555555-5555-4555-8555-555555555555",
      boxes: 2,
      extraUnits: 0,
      createdAt: "2026-06-29T09:00:00.000Z",
      product: {
        id: "55555555-5555-4555-8555-555555555555",
        name: "Rosé",
        qtyPerBox: 6,
        imageUrl: null,
      },
    }),
  ],
  user: { id: "33333333-3333-4333-8333-333333333333", name: "Jane Placer" },
  account: { id: "22222222-2222-4222-8222-222222222222", name: "The Winery Bistro" },
});

test("shows both the delivery address and the delivery instructions", () => {
  render(
    <OrderDetailsView
      order={{
        ...baseOrder,
        deliveryAddress: "12 Vine St, Hawthorn",
        deliveryInstructions: "Leave at the rear door",
      }}
      placedByName="Jane Placer"
      onBack={() => {}}
    />,
  );

  expect(screen.getByText("Delivery address")).toBeInTheDocument();
  expect(screen.getByText("12 Vine St, Hawthorn")).toBeInTheDocument();
  expect(screen.getByText("Delivery instructions")).toBeInTheDocument();
  expect(screen.getByText("Leave at the rear door")).toBeInTheDocument();
});

test("shows the address label without an instructions label when only the address is present", () => {
  render(
    <OrderDetailsView
      order={{ ...baseOrder, deliveryAddress: "12 Vine St, Hawthorn" }}
      placedByName="Jane Placer"
      onBack={() => {}}
    />,
  );

  expect(screen.getByText("Delivery address")).toBeInTheDocument();
  expect(screen.queryByText("Delivery instructions")).not.toBeInTheDocument();
});

test("shows the instructions label without an address label when only instructions are present", () => {
  render(
    <OrderDetailsView
      order={{ ...baseOrder, deliveryInstructions: "Leave at the rear door" }}
      placedByName="Jane Placer"
      onBack={() => {}}
    />,
  );

  expect(screen.getByText("Delivery instructions")).toBeInTheDocument();
  expect(screen.queryByText("Delivery address")).not.toBeInTheDocument();
});

test("renders no delivery section when neither address nor instructions are present", () => {
  render(<OrderDetailsView order={baseOrder} placedByName="Jane Placer" onBack={() => {}} />);

  expect(screen.queryByText("Delivery address")).not.toBeInTheDocument();
  expect(screen.queryByText("Delivery instructions")).not.toBeInTheDocument();
});
