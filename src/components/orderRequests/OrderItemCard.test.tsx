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
    render(<OrderItemCard readOnly name="Pinot Noir" qtyPerBox={12} boxes={2} bottles={3} />);

    expect(screen.getByText("Pinot Noir")).toBeInTheDocument();
  });

  test("renders qty_per_box subtitle", () => {
    render(<OrderItemCard readOnly name="Pinot Noir" qtyPerBox={12} boxes={2} bottles={3} />);

    expect(screen.getByText("12 per box")).toBeInTheDocument();
  });

  test("renders box count", () => {
    render(<OrderItemCard readOnly name="Pinot Noir" qtyPerBox={12} boxes={2} bottles={3} />);

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("renders bottle count", () => {
    render(<OrderItemCard readOnly name="Pinot Noir" qtyPerBox={12} boxes={2} bottles={3} />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("renders computed total (boxes × qty_per_box + bottles)", () => {
    render(<OrderItemCard readOnly name="Pinot Noir" qtyPerBox={12} boxes={2} bottles={3} />);

    // 2 × 12 + 3 = 27
    expect(screen.getByText("27")).toBeInTheDocument();
  });

  test("does not render stepper buttons", () => {
    render(<OrderItemCard readOnly name="Pinot Noir" qtyPerBox={12} boxes={2} bottles={3} />);

    expect(screen.queryByRole("button", { name: /increase|decrease/i })).not.toBeInTheDocument();
  });
});

describe("editable mode", () => {
  test("renders the product name", () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        qtyPerBox={6}
        boxes={2}
        bottles={3}
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
        qtyPerBox={6}
        boxes={2}
        bottles={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText("6 per box")).toBeInTheDocument();
  });

  test("renders computed total (boxes × qty_per_box + bottles)", () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        qtyPerBox={6}
        boxes={2}
        bottles={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    // 2 × 6 + 3 = 15
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  test("clicking Increase boxes calls onUpdate with boxes + 1", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        qtyPerBox={6}
        boxes={2}
        bottles={3}
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
        qtyPerBox={6}
        boxes={2}
        bottles={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Decrease boxes" }));

    expect(onUpdate).toHaveBeenCalledWith({ boxes: 1 });
  });

  test("clicking Decrease boxes does not go below 0", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        qtyPerBox={6}
        boxes={0}
        bottles={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Decrease boxes" }));

    expect(onUpdate).toHaveBeenCalledWith({ boxes: 0 });
  });

  test("clicking Increase bottles calls onUpdate with extra_bottles + 1", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        qtyPerBox={6}
        boxes={2}
        bottles={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Increase bottles" }));

    expect(onUpdate).toHaveBeenCalledWith({ extra_bottles: 4 });
  });

  test("clicking Decrease bottles calls onUpdate with extra_bottles - 1", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        qtyPerBox={6}
        boxes={2}
        bottles={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Decrease bottles" }));

    expect(onUpdate).toHaveBeenCalledWith({ extra_bottles: 2 });
  });

  test("clicking Decrease bottles does not go below 0", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        qtyPerBox={6}
        boxes={2}
        bottles={0}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Decrease bottles" }));

    expect(onUpdate).toHaveBeenCalledWith({ extra_bottles: 0 });
  });

  test("clicking remove calls onRemove", async () => {
    render(
      <OrderItemCard
        name="Chardonnay"
        qtyPerBox={6}
        boxes={2}
        bottles={3}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Remove Chardonnay/i }));

    expect(onRemove).toHaveBeenCalledOnce();
  });
});
