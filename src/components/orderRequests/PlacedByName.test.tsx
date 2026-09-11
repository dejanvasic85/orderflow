import { render, screen } from "@testing-library/react";
import { PlacedByName } from "./PlacedByName";

test("shows the name on its own when the placer is still active", () => {
  render(<PlacedByName name="Jane Smith" />);

  expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  expect(screen.queryByText("(deleted)")).not.toBeInTheDocument();
});

test("keeps the name and adds a deleted marker when the placer was deleted", () => {
  render(<PlacedByName name="Jane Smith" deleted />);

  expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  expect(screen.getByText("(deleted)")).toBeInTheDocument();
});

test("does not mark the placer when deleted is false", () => {
  render(<PlacedByName name="Jane Smith" deleted={false} />);

  expect(screen.queryByText("(deleted)")).not.toBeInTheDocument();
});
