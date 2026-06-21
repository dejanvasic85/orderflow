import { render, screen } from "@testing-library/react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

it("shows the Weak label for a short password", () => {
  render(<PasswordStrengthMeter password="abc" />);

  expect(screen.getByText("Weak")).toBeInTheDocument();
});

it("shows the Strong label for a long mixed password", () => {
  render(<PasswordStrengthMeter password="Abcdefghij12!" />);

  expect(screen.getByText("Strong")).toBeInTheDocument();
});

it("does not show a strength label for an empty password", () => {
  render(<PasswordStrengthMeter password="" />);

  expect(screen.queryByText("Weak")).not.toBeInTheDocument();
  expect(screen.queryByText("Strong")).not.toBeInTheDocument();
});

it("lists each password requirement", () => {
  render(<PasswordStrengthMeter password="abc" />);

  expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
  expect(screen.getByText("A lowercase letter")).toBeInTheDocument();
  expect(screen.getByText("An uppercase letter")).toBeInTheDocument();
  expect(screen.getByText("A number")).toBeInTheDocument();
});

it("announces met and unmet requirements for screen readers", () => {
  render(<PasswordStrengthMeter password="abc" />);

  expect(screen.getByText("Met:")).toBeInTheDocument();
  expect(screen.getAllByText("Not met:").length).toBeGreaterThan(0);
});
