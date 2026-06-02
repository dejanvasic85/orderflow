import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { OrderHistoryItem } from "@/lib/orderRequests/orderRequests.server";
import { OrderHistoryList } from "./OrderHistoryList";

const orderOne: OrderHistoryItem = {
  id: "order-1",
  order_number: 1,
  placed_by: "user-1",
  placed_by_name: "Alice Smith",
  status: "submitted",
  created_at: "2024-06-01T08:00:00Z",
  total_boxes: 2,
  total_bottles: 0,
};

const orderTwo: OrderHistoryItem = {
  id: "order-2",
  order_number: 2,
  placed_by: "user-2",
  placed_by_name: "Bob Jones",
  status: "completed",
  created_at: "2024-06-02T09:00:00Z",
  total_boxes: 5,
  total_bottles: 3,
};

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

  it("calls onViewOrder with the correct order id when View order is clicked", async () => {
    const handleViewOrder = vi.fn();

    render(<OrderHistoryList orders={[orderOne, orderTwo]} onViewOrder={handleViewOrder} />);

    const viewButtons = screen.getAllByRole("button", { name: /view order/i });
    await userEvent.click(viewButtons[0]);

    expect(handleViewOrder).toHaveBeenCalledWith("order-1");
  });
});
