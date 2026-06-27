import { render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OrderHistoryItem } from "@/lib/orderRequests/schema";
import { OrderHistoryCard } from "./OrderHistoryCard";

const baseOrder: OrderHistoryItem = {
  id: "order-abc",
  order_number: 42,
  placed_by: "user-1",
  placedByName: "Alice Smith",
  created_at: "2024-06-15T12:00:00Z",
  total_boxes: 3,
  total_units: 5,
};

const externalOrder: OrderHistoryItem = {
  ...baseOrder,
  placedByName: "bwow",
  placedByOrgName: "Boutique Wines of the World",
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

  it("renders total units count", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("units")).toBeInTheDocument();
  });

  it("renders the date as an amber pill", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    // Mid-month noon UTC avoids timezone day-boundary shifts across any locale
    const pill = screen.getByText(/15 June? 2024/);
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveClass("bg-amber-100");
  });

  it("does not render a View order link when viewHref is not provided", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.queryByRole("link", { name: /view order/i })).not.toBeInTheDocument();
  });

  it("renders a View order link with the correct href when viewHref is provided", () => {
    render(<OrderHistoryCard order={baseOrder} viewHref="/orders/order-abc" />);

    const link = screen.getByRole("link", { name: /view order/i });
    expect(link).toHaveAttribute("href", "/orders/order-abc");
  });

  it("shows placedByName when placedByOrgName is set", () => {
    render(
      <TooltipProvider>
        <OrderHistoryCard order={externalOrder} />
      </TooltipProvider>,
    );

    expect(screen.getByText("bwow")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });
});
