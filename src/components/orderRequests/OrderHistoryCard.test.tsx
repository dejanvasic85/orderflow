import { render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OrderHistoryItem } from "@/lib/orderRequests/schema";
import { OrderHistoryCard } from "./OrderHistoryCard";

const baseOrder: OrderHistoryItem = {
  id: "order-abc",
  orderNumber: 42,
  placedBy: "user-1",
  placedByName: "Alice Smith",
  createdAt: "2024-06-15T12:00:00Z",
  totalBoxes: 3,
  totalUnits: 5,
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

  it("renders the date", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    // Mid-month noon UTC avoids timezone day-boundary shifts across any locale
    expect(screen.getByText(/15 June? 2024/)).toBeInTheDocument();
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

  it("does not render a Re-order link when reorderHref is not provided", () => {
    render(<OrderHistoryCard order={baseOrder} />);

    expect(screen.queryByRole("link", { name: /re-order/i })).not.toBeInTheDocument();
  });

  it("renders a Re-order link with the correct href when reorderHref is provided", () => {
    render(
      <OrderHistoryCard order={baseOrder} reorderHref="/manage/orders/new?fromOrderId=order-abc" />,
    );

    const link = screen.getByRole("link", { name: /re-order/i });
    expect(link).toHaveAttribute("href", "/manage/orders/new?fromOrderId=order-abc");
  });

  it("renders both View order and Re-order links when both hrefs are provided", () => {
    render(
      <OrderHistoryCard
        order={baseOrder}
        viewHref="/orders/order-abc"
        reorderHref="/manage/orders/new?fromOrderId=order-abc"
      />,
    );

    expect(screen.getByRole("link", { name: /view order/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /re-order/i })).toBeInTheDocument();
  });
});
