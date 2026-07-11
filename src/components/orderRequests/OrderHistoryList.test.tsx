import { render, screen } from "@testing-library/react";
import { makeOrderHistoryItem } from "@/test/fixtures/orderFixtures";
import { OrderHistoryList } from "./OrderHistoryList";

const orderOne = makeOrderHistoryItem({
  id: "order-1",
  orderNumber: 1,
  placedBy: "user-1",
  placedByName: "Alice Smith",
  createdAt: "2024-06-01T08:00:00Z",
  totalBoxes: 2,
  totalUnits: 0,
});

const orderTwo = makeOrderHistoryItem({
  id: "order-2",
  orderNumber: 2,
  placedBy: "user-2",
  placedByName: "Bob Jones",
  createdAt: "2024-06-02T09:00:00Z",
  totalBoxes: 5,
  totalUnits: 3,
});

describe("OrderHistoryList", () => {
  it("renders an empty state when there are no orders", () => {
    render(<OrderHistoryList orders={[]} />);

    expect(screen.getByText("No orders yet")).toBeInTheDocument();
    expect(
      screen.getByText("Orders placed for this account will appear here."),
    ).toBeInTheDocument();
  });

  it("renders a card for each order", () => {
    render(<OrderHistoryList orders={[orderOne, orderTwo]} />);

    expect(screen.getByText("ORD-0001")).toBeInTheDocument();
    expect(screen.getByText("ORD-0002")).toBeInTheDocument();
  });

  it("renders placed-by names for all orders", () => {
    render(<OrderHistoryList orders={[orderOne, orderTwo]} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders View order links with correct hrefs when buildViewHref is provided", () => {
    render(
      <OrderHistoryList orders={[orderOne, orderTwo]} buildViewHref={(id) => `/orders/${id}`} />,
    );

    const links = screen.getAllByRole("link", { name: /view order/i });
    expect(links[0]).toHaveAttribute("href", "/orders/order-1");
    expect(links[1]).toHaveAttribute("href", "/orders/order-2");
  });
});
