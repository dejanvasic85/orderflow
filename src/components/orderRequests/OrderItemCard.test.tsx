import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderItemCard } from "./OrderItemCard";

const onUpdate = vi.fn();
const onRemove = vi.fn();

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup();
});

describe("read-only mode", () => {
  test("renders the product name", () => {
    render(
      <OrderItemCard
        readOnly
        name="Pinot Noir"
        imageUrl={null}
        qtyPerBox={12}
        boxes={2}
        units={3}
      />,
    );

    expect(screen.getByText("Pinot Noir")).toBeInTheDocument();
  });

  test("renders qty_per_box subtitle", () => {
    render(
      <OrderItemCard
        readOnly
        name="Pinot Noir"
        imageUrl={null}
        qtyPerBox={12}
        boxes={2}
        units={3}
      />,
    );

    expect(screen.getByText("12 per box")).toBeInTheDocument();
  });

  test("renders computed total (boxes × qty_per_box + units)", () => {
    render(
      <OrderItemCard
        readOnly
        name="Pinot Noir"
        imageUrl={null}
        qtyPerBox={12}
        boxes={2}
        units={3}
      />,
    );

    // 2 × 12 + 3 = 27
    expect(screen.getByLabelText("Total 27")).toBeInTheDocument();
  });

  test("does not render stepper buttons", () => {
    render(
      <OrderItemCard
        readOnly
        name="Pinot Noir"
        imageUrl={null}
        qtyPerBox={12}
        boxes={2}
        units={3}
      />,
    );

    expect(screen.queryByRole("button", { name: /increase|decrease/i })).not.toBeInTheDocument();
  });

  test("does not render a remove button", () => {
    render(
      <OrderItemCard
        readOnly
        name="Pinot Noir"
        imageUrl={null}
        qtyPerBox={12}
        boxes={2}
        units={3}
      />,
    );

    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  test("renders the placeholder when imageUrl is null", () => {
    render(
      <OrderItemCard
        readOnly
        name="Pinot Noir"
        imageUrl={null}
        qtyPerBox={12}
        boxes={2}
        units={3}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("renders the product image when imageUrl is provided", () => {
    render(
      <OrderItemCard
        readOnly
        name="Pinot Noir"
        imageUrl="https://example.com/pinot.jpg"
        qtyPerBox={12}
        boxes={2}
        units={3}
      />,
    );

    expect(screen.getByRole("img", { name: "Pinot Noir" })).toBeInTheDocument();
  });
});

describe("editable mode", () => {
  test("renders the product name", () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText("Chardonnay")).toBeInTheDocument();
  });

  test("renders qty_per_box subtitle", () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText("6 per box")).toBeInTheDocument();
  });

  test("renders computed total (boxes × qty_per_box + units)", () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    // 2 × 6 + 3 = 15
    expect(screen.getByLabelText("Total 15")).toBeInTheDocument();
  });

  test("the boxes field shows the current value", () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByLabelText("Boxes quantity")).toHaveValue("2");
  });

  test("typing a new boxes value calls onUpdate with that number", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={0}
        units={0}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.type(screen.getByLabelText("Boxes quantity"), "20");

    expect(onUpdate).toHaveBeenLastCalledWith({ boxes: 20 });
  });

  test("clicking Increase boxes calls onUpdate with boxes + 1", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Increase boxes" }));

    expect(onUpdate).toHaveBeenCalledWith({ boxes: 3 });
  });

  test("clicking Decrease boxes calls onUpdate with boxes - 1", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Decrease boxes" }));

    expect(onUpdate).toHaveBeenCalledWith({ boxes: 1 });
  });

  test("Decrease boxes is disabled at 0", () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={0}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByRole("button", { name: "Decrease boxes" })).toBeDisabled();
  });

  test("clicking Increase units calls onUpdate with extraUnits + 1", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Increase units" }));

    expect(onUpdate).toHaveBeenCalledWith({ extraUnits: 4 });
  });

  test("clicking Decrease units calls onUpdate with extraUnits - 1", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Decrease units" }));

    expect(onUpdate).toHaveBeenCalledWith({ extraUnits: 2 });
  });

  test("clicking remove calls onRemove", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        imageUrl={null}
        qtyPerBox={6}
        boxes={2}
        units={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Remove Chardonnay/i }));

    expect(onRemove).toHaveBeenCalledOnce();
  });
});
