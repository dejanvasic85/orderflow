import { render, screen } from "@testing-library/react";
import { UserStatusBadge } from "./UserStatusBadge";

test("renders Active label for active status", () => {
  render(<UserStatusBadge status="active" />);
  expect(screen.getByText("Active")).toBeInTheDocument();
});

test("renders Inactive label for inactive status", () => {
  render(<UserStatusBadge status="inactive" />);
  expect(screen.getByText("Inactive")).toBeInTheDocument();
});

test("renders Pending label for pending status", () => {
  render(<UserStatusBadge status="pending" />);
  expect(screen.getByText("Pending")).toBeInTheDocument();
});
