import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ProductRow } from "@/lib/products/schema";
import { ProductEditPanel } from "./ProductEditPanel";

vi.mock("@/components/products/ImageUpload", () => ({
  ImageUpload: ({
    currentUrl,
    onUploaded,
  }: {
    currentUrl: string | null;
    onUploaded: (url: string) => void;
  }) => (
    <div>
      {currentUrl && <img src={currentUrl} alt="Current product image" />}
      <input aria-label="Image upload" type="text" onChange={(e) => onUploaded(e.target.value)} />
    </div>
  ),
}));

const existingProduct: ProductRow = {
  id: "prod-1",
  name: "Sparkling Water",
  image_url: "https://images.example.com/sparkling.jpg",
  qty_per_box: 12,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const onSave = vi.fn();
const onDiscard = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("create mode submits the mapped payload", async () => {
  render(<ProductEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.type(screen.getByLabelText("Name"), "Cider — Apple");
  await user.type(screen.getByLabelText("Image upload"), "https://images.example.com/cider.jpg");
  await user.clear(screen.getByLabelText("Quantity per box"));
  await user.type(screen.getByLabelText("Quantity per box"), "6");
  await user.click(screen.getByRole("button", { name: "Create product" }));

  expect(onSave).toHaveBeenCalledWith({
    name: "Cider — Apple",
    image_url: "https://images.example.com/cider.jpg",
    qty_per_box: 6,
    active: true,
  });
});

test("create mode submits null image_url when left empty", async () => {
  render(<ProductEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.type(screen.getByLabelText("Name"), "Cider — Apple");
  await user.click(screen.getByRole("button", { name: "Create product" }));

  expect(onSave).toHaveBeenCalledWith({
    name: "Cider — Apple",
    image_url: null,
    qty_per_box: 1,
    active: true,
  });
});

test("create mode shows an error and does not submit when name is empty", async () => {
  render(<ProductEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Create product" }));

  expect(screen.getByText("Name is required")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("edit mode prefills fields from the product", () => {
  render(<ProductEditPanel product={existingProduct} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByLabelText("Name")).toHaveValue("Sparkling Water");
  expect(screen.getByAltText("Current product image")).toHaveAttribute(
    "src",
    "https://images.example.com/sparkling.jpg",
  );
  expect(screen.getByLabelText("Quantity per box")).toHaveValue(12);
});

test("edit mode submits the payload including the product id", async () => {
  render(<ProductEditPanel product={existingProduct} onSave={onSave} onDiscard={onDiscard} />);

  await user.clear(screen.getByLabelText("Quantity per box"));
  await user.type(screen.getByLabelText("Quantity per box"), "24");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(onSave).toHaveBeenCalledWith({
    id: "prod-1",
    name: "Sparkling Water",
    image_url: "https://images.example.com/sparkling.jpg",
    qty_per_box: 24,
    active: true,
  });
});

test("edit mode submits active false after toggling the Active switch off", async () => {
  render(<ProductEditPanel product={existingProduct} onSave={onSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("switch", { name: "Active" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(onSave).toHaveBeenCalledWith({
    id: "prod-1",
    name: "Sparkling Water",
    image_url: "https://images.example.com/sparkling.jpg",
    qty_per_box: 12,
    active: false,
  });
});

test("disables the button and shows Saving… while onSave is pending", async () => {
  let resolveSave: () => void = () => {};
  const pendingSave = vi.fn(() => new Promise<void>((resolve) => (resolveSave = resolve)));

  render(<ProductEditPanel product={existingProduct} onSave={pendingSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Save changes" }));

  const savingButton = await screen.findByRole("button", { name: "Saving…" });
  expect(savingButton).toBeDisabled();

  resolveSave();

  expect(await screen.findByRole("button", { name: "Save changes" })).toBeEnabled();
});

test("calls onDiscard when Discard is clicked", async () => {
  render(<ProductEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Discard" }));

  expect(onDiscard).toHaveBeenCalledTimes(1);
});
