import { render, screen } from "@testing-library/react";
import type { OrderRequestWithItems } from "@/lib/orderRequests/schema";
import { OrderDetailsView } from "./OrderDetailsView";

const baseOrder: OrderRequestWithItems = {
  id: "11111111-1111-4111-8111-111111111111",
  order_number: 42,
  account_id: "22222222-2222-4222-8222-222222222222",
  placed_by: "33333333-3333-4333-8333-333333333333",
  template_id: null,
  delivery_address: null,
  delivery_instructions: null,
  created_at: "2026-06-29T09:00:00.000Z",
  updated_at: "2026-06-29T09:00:00.000Z",
  order_request_items: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      order_request_id: "11111111-1111-4111-8111-111111111111",
      product_id: "55555555-5555-4555-8555-555555555555",
      boxes: 2,
      extra_units: 0,
      created_at: "2026-06-29T09:00:00.000Z",
      products: {
        id: "55555555-5555-4555-8555-555555555555",
        name: "Rosé",
        qty_per_box: 6,
        image_url: null,
      },
    },
  ],
  templates: null,
  users: { id: "33333333-3333-4333-8333-333333333333", name: "Jane Placer" },
  accounts: { id: "22222222-2222-4222-8222-222222222222", name: "The Winery Bistro" },
};

test("shows both the delivery address and the delivery instructions", () => {
  render(
    <OrderDetailsView
      order={{
        ...baseOrder,
        delivery_address: "12 Vine St, Hawthorn",
        delivery_instructions: "Leave at the rear door",
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
      order={{ ...baseOrder, delivery_address: "12 Vine St, Hawthorn" }}
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
      order={{ ...baseOrder, delivery_instructions: "Leave at the rear door" }}
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
