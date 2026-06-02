import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { OrderHistoryItem } from "@/lib/orderRequests/orderRequests.server";
import { OrderHistoryCard } from "./OrderHistoryCard";

const baseOrder: OrderHistoryItem = {
  id: "order-abc",
  order_number: 42,
  placed_by: "user-1",
  placed_by_name: "Alice Smith",
  status: "submitted",
  created_at: "2024-06-01T10:00:00Z",
  total_boxes: 3,
  total_bottles: 5,
};

describe("OrderHistoryCard", () => {
  it("renders the formatted order reference", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.getByText("ORD-0042")).toBeInTheDocument();
  });

  it("renders the placed-by name", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("renders total boxes count", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("boxes")).toBeInTheDocument();
  });

  it("renders total bottles count", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("bottles")).toBeInTheDocument();
  });

  it("renders the formatted date", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.getByText(/1 Jun(e)? 2024/)).toBeInTheDocument();
  });

  it("renders a View order button", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.getByRole("button", { name: /view order/i })).toBeInTheDocument();
  });

  it("calls onView with the order id when View order is clicked", async () => {
    const handleView = vi.fn();

    render(<OrderHistoryCard order={baseOrder} onView={handleView} />);

    await userEvent.click(screen.getByRole("button", { name: /view order/i }));

    expect(handleView).toHaveBeenCalledWith("order-abc");
  });

  it("renders the submitted status badge", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.getByText("Submitted")).toBeInTheDocument();
  });

  it("renders the completed status badge for a completed order", () => {
    const completedOrder: OrderHistoryItem = { ...baseOrder, status: "completed" };

    render(<OrderHistoryCard order={completedOrder} />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
