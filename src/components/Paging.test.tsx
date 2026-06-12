import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { Paging } from "./Paging";

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders nothing when totalPages is 1", () => {
  const { container } = render(<Paging currentPage={1} totalPages={1} onPageChange={vi.fn()} />);

  expect(container).toBeEmptyDOMElement();
});

test("renders nothing when totalPages is 0", () => {
  const { container } = render(<Paging currentPage={1} totalPages={0} onPageChange={vi.fn()} />);

  expect(container).toBeEmptyDOMElement();
});

test("renders Previous, page indicator and Next when totalPages is greater than 1", () => {
  render(<Paging currentPage={2} totalPages={5} onPageChange={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
  expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
});

test("disables Previous on the first page", () => {
  render(<Paging currentPage={1} totalPages={3} onPageChange={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
});

test("disables Next on the last page", () => {
  render(<Paging currentPage={3} totalPages={3} onPageChange={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
});

test("disables both buttons when isLoading is true", () => {
  render(<Paging currentPage={2} totalPages={3} isLoading onPageChange={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

test("calls onPageChange with page - 1 when Previous is clicked", async () => {
  const onPageChange = vi.fn();

  render(<Paging currentPage={3} totalPages={5} onPageChange={onPageChange} />);

  await user.click(screen.getByRole("button", { name: "Previous" }));

  expect(onPageChange).toHaveBeenCalledWith(2);
});

test("calls onPageChange with page + 1 when Next is clicked", async () => {
  const onPageChange = vi.fn();

  render(<Paging currentPage={3} totalPages={5} onPageChange={onPageChange} />);

  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(onPageChange).toHaveBeenCalledWith(4);
});
