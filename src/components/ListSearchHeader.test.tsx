import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListSearchHeader } from "./ListSearchHeader";

test("renders the input with its placeholder and accessible label", () => {
  render(
    <ListSearchHeader
      value=""
      placeholder="Search by name..."
      ariaLabel="Search accounts"
      onChange={() => {}}
    />,
  );

  expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument();
  expect(screen.getByLabelText("Search accounts")).toBeInTheDocument();
});

test("shows the count label when provided", () => {
  render(
    <ListSearchHeader
      value=""
      placeholder="Search by name..."
      ariaLabel="Search accounts"
      countLabel="2 accounts"
      onChange={() => {}}
    />,
  );

  expect(screen.getByText("2 accounts")).toBeInTheDocument();
});

test("omits the count label when not provided", () => {
  render(
    <ListSearchHeader
      value=""
      placeholder="Search orders"
      ariaLabel="Search orders"
      onChange={() => {}}
    />,
  );

  expect(screen.queryByText(/order/)).not.toBeInTheDocument();
});

test("calls onChange with the typed value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();
  render(
    <ListSearchHeader
      value=""
      placeholder="Search by name..."
      ariaLabel="Search accounts"
      onChange={handleChange}
    />,
  );

  await user.type(screen.getByLabelText("Search accounts"), "a");

  expect(handleChange).toHaveBeenCalledWith("a");
});
