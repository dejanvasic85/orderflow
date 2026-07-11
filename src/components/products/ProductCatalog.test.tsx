import { act, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { makeProduct } from "@/test/fixtures/productFixtures";
import { ProductCatalog } from "./ProductCatalog";

const products = [
  makeProduct({ id: "prod-1", name: "Sparkling Water" }),
  makeProduct({ id: "prod-2", name: "Still Water" }),
  makeProduct({ id: "prod-3", name: "Orange Juice" }),
];

const onSearchChange = vi.fn();
const onPageChange = vi.fn();
const onSelectProduct = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderCatalog(overrides: Partial<Parameters<typeof ProductCatalog>[0]> = {}) {
  return render(
    <ProductCatalog
      products={products}
      total={3}
      searchQuery=""
      currentPage={1}
      totalPages={1}
      onSearchChange={onSearchChange}
      onPageChange={onPageChange}
      {...overrides}
    />,
  );
}

test("renders all products passed as props", () => {
  renderCatalog();

  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
  expect(screen.getByText("Still Water")).toBeInTheDocument();
  expect(screen.getByText("Orange Juice")).toBeInTheDocument();
});

test("renders product count label from total", () => {
  renderCatalog({ total: 42 });

  expect(screen.getByText("42 products")).toBeInTheDocument();
});

test("renders singular count label when total is 1", () => {
  renderCatalog({ products: [makeProduct()], total: 1 });

  expect(screen.getByText("1 product")).toBeInTheDocument();
});

test("calls onSearchChange after 300ms debounce when user types", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const debouncedUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });

  renderCatalog({ products: [], total: 0 });

  const input = screen.getByRole("textbox", { name: "Search products" });
  await debouncedUser.type(input, "gin");

  await act(async () => {
    vi.runAllTimers();
  });

  expect(onSearchChange).toHaveBeenCalledWith("gin");
});

test("does not call onSearchChange on mount when input matches the search query", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });

  renderCatalog({ searchQuery: "gin" });

  await act(async () => {
    vi.runAllTimers();
  });

  expect(onSearchChange).not.toHaveBeenCalled();
});

test("shows no-results empty state when empty with a search query", () => {
  renderCatalog({ products: [], total: 0, searchQuery: "xyz" });

  expect(screen.getByText("No products found")).toBeInTheDocument();
});

test("shows no-products empty state when empty without a search query", () => {
  renderCatalog({ products: [], total: 0 });

  expect(screen.getByText("No products available")).toBeInTheDocument();
});

test("shows Inactive badge for inactive products", () => {
  renderCatalog({
    products: [makeProduct({ id: "prod-1", name: "Sparkling Water", active: false })],
    total: 1,
  });

  expect(screen.getByText("Inactive")).toBeInTheDocument();
});

test("does not show Inactive badge for active products", () => {
  renderCatalog();

  expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
});

test("calls onSelectProduct with the product when a card is clicked", async () => {
  renderCatalog({ onSelectProduct });

  await user.click(screen.getByRole("button", { name: "Edit Sparkling Water" }));

  expect(onSelectProduct).toHaveBeenCalledWith(products[0]);
});

test("renders no edit buttons when onSelectProduct is not provided", () => {
  renderCatalog();

  expect(screen.queryByRole("button", { name: /^Edit / })).not.toBeInTheDocument();
});

test("calls onPageChange with the next page when Next is clicked", async () => {
  renderCatalog({ currentPage: 1, totalPages: 2 });

  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(onPageChange).toHaveBeenCalledWith(2);
});

test("hides pagination when totalPages is 1", () => {
  renderCatalog({ currentPage: 1, totalPages: 1 });

  expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
});

test("shows skeleton cards instead of products when isLoading is true", () => {
  renderCatalog({ isLoading: true });

  expect(screen.queryByText("Sparkling Water")).not.toBeInTheDocument();
  expect(screen.queryByText("No products available")).not.toBeInTheDocument();
});
