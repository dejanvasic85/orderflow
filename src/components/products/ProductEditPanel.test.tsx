import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { makeProduct } from "@/test/fixtures/productFixtures";
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

const existingProduct = makeProduct({
  id: "prod-1",
  name: "Sparkling Water",
  imageUrl: "https://images.example.com/sparkling.jpg",
  qtyPerBox: 12,
});

const onSave = vi.fn();
const onDiscard = vi.fn();
const onDelete = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("create mode submits the mapped payload", async () => {
  render(<ProductEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.type(screen.getByLabelText("Name"), "Cider Apple");
  await user.type(screen.getByLabelText("Image upload"), "https://images.example.com/cider.jpg");
  await user.clear(screen.getByLabelText("Quantity per box"));
  await user.type(screen.getByLabelText("Quantity per box"), "6");
  await user.click(screen.getByRole("button", { name: "Create product" }));

  expect(onSave).toHaveBeenCalledWith({
    name: "Cider Apple",
    imageUrl: "https://images.example.com/cider.jpg",
    qtyPerBox: 6,
  });
});

test("create mode submits null imageUrl when left empty", async () => {
  render(<ProductEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.type(screen.getByLabelText("Name"), "Cider Apple");
  await user.click(screen.getByRole("button", { name: "Create product" }));

  expect(onSave).toHaveBeenCalledWith({
    name: "Cider Apple",
    imageUrl: null,
    qtyPerBox: 1,
  });
});

test("create mode shows an error and does not submit when name is empty", async () => {
  render(<ProductEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Create product" }));

  expect(screen.getByText("Name is required")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("create mode does not offer a delete button", () => {
  render(<ProductEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.queryByRole("button", { name: "Delete product" })).not.toBeInTheDocument();
});

test("edit mode prefills fields from the product", () => {
  render(
    <ProductEditPanel
      product={existingProduct}
      onSave={onSave}
      onDelete={onDelete}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.getByLabelText("Name")).toHaveValue("Sparkling Water");
  expect(screen.getByAltText("Current product image")).toHaveAttribute(
    "src",
    "https://images.example.com/sparkling.jpg",
  );
  expect(screen.getByLabelText("Quantity per box")).toHaveValue(12);
});

test("edit mode submits the payload including the product id", async () => {
  render(
    <ProductEditPanel
      product={existingProduct}
      onSave={onSave}
      onDelete={onDelete}
      onDiscard={onDiscard}
    />,
  );

  await user.clear(screen.getByLabelText("Quantity per box"));
  await user.type(screen.getByLabelText("Quantity per box"), "24");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(onSave).toHaveBeenCalledWith({
    id: "prod-1",
    name: "Sparkling Water",
    imageUrl: "https://images.example.com/sparkling.jpg",
    qtyPerBox: 24,
  });
});

test("edit mode warns that deleting cannot be undone", () => {
  render(
    <ProductEditPanel
      product={existingProduct}
      onSave={onSave}
      onDelete={onDelete}
      onDiscard={onDiscard}
    />,
  );

  expect(
    screen.getByText(
      "This removes the product from the catalog for everyone. You cannot undo this.",
    ),
  ).toBeInTheDocument();
});

test("edit mode asks for confirmation before deleting", async () => {
  render(
    <ProductEditPanel
      product={existingProduct}
      onSave={onSave}
      onDelete={onDelete}
      onDiscard={onDiscard}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Delete product" }));

  expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  expect(onDelete).not.toHaveBeenCalled();
});

test("edit mode calls onDelete with the product id once confirmed", async () => {
  render(
    <ProductEditPanel
      product={existingProduct}
      onSave={onSave}
      onDelete={onDelete}
      onDiscard={onDiscard}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Delete product" }));
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Delete product" }));

  expect(onDelete).toHaveBeenCalledWith("prod-1");
});

test("edit mode does not call onDelete when the confirmation is cancelled", async () => {
  render(
    <ProductEditPanel
      product={existingProduct}
      onSave={onSave}
      onDelete={onDelete}
      onDiscard={onDiscard}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Delete product" }));
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

  expect(onDelete).not.toHaveBeenCalled();
});

test("disables the button and shows Saving… while onSave is pending", async () => {
  let resolveSave: () => void = () => {};
  const pendingSave = vi.fn(() => new Promise<void>((resolve) => (resolveSave = resolve)));

  render(
    <ProductEditPanel
      product={existingProduct}
      onSave={pendingSave}
      onDelete={onDelete}
      onDiscard={onDiscard}
    />,
  );

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
