import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { UserAccountsSection } from "./UserAccountsSection";

const allAccounts = [
  { id: "acc-1", name: "Acme Corp" },
  { id: "acc-2", name: "Beta Ltd" },
  { id: "acc-3", name: "Gamma Inc" },
];

const onChange = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("shows empty state when no accounts are assigned", () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  expect(screen.getByText("No accounts assigned.")).toBeInTheDocument();
});

test("renders initially assigned accounts", () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[{ id: "acc-1", name: "Acme Corp" }]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  expect(screen.queryByText("No accounts assigned.")).not.toBeInTheDocument();
});

test("calls onChange on mount with empty toAdd and toRemove for existing accounts", () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[{ id: "acc-1", name: "Acme Corp" }]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  expect(onChange).toHaveBeenCalledWith({ userId: "u-1", toAdd: [], toRemove: [] });
});

test("shows dropdown options when search input is focused", async () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  await user.click(screen.getByPlaceholderText("Search accounts..."));

  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
  expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
});

test("filters dropdown options by search text", async () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  await user.type(screen.getByPlaceholderText("Search accounts..."), "beta");

  expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
  expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
});

test("shows no accounts found when search matches nothing", async () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  await user.type(screen.getByPlaceholderText("Search accounts..."), "zzz");

  expect(screen.getByText("No accounts found.")).toBeInTheDocument();
});

test("adds an account from the dropdown and calls onChange with toAdd", async () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  await user.click(screen.getByPlaceholderText("Search accounts..."));
  await user.click(screen.getByText("Beta Ltd"));

  expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
  expect(onChange).toHaveBeenLastCalledWith({ userId: "u-1", toAdd: ["acc-2"], toRemove: [] });
});

test("excludes already-assigned accounts from the dropdown", async () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[{ id: "acc-1", name: "Acme Corp" }]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  await user.click(screen.getByPlaceholderText("Search accounts..."));

  expect(screen.queryByRole("option", { name: "Acme Corp" })).not.toBeInTheDocument();
  expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
});

test("removes an existing account and calls onChange with toRemove", async () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[{ id: "acc-1", name: "Acme Corp" }]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Remove Acme Corp" }));

  expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  expect(screen.getByText("No accounts assigned.")).toBeInTheDocument();
  expect(onChange).toHaveBeenLastCalledWith({ userId: "u-1", toAdd: [], toRemove: ["acc-1"] });
});

test("removing a freshly added account produces empty toAdd and toRemove", async () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  await user.click(screen.getByPlaceholderText("Search accounts..."));
  await user.click(screen.getByText("Acme Corp"));
  await user.click(screen.getByRole("button", { name: "Remove Acme Corp" }));

  expect(onChange).toHaveBeenLastCalledWith({ userId: "u-1", toAdd: [], toRemove: [] });
});

test("re-adding a previously removed account restores it without toRemove entry", async () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={[{ id: "acc-1", name: "Acme Corp" }]}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Remove Acme Corp" }));
  await user.click(screen.getByPlaceholderText("Search accounts..."));
  await user.click(screen.getByText("Acme Corp"));

  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  expect(onChange).toHaveBeenLastCalledWith({ userId: "u-1", toAdd: [], toRemove: [] });
});

test("disables search input and shows 'All accounts assigned' when all are assigned", () => {
  render(
    <UserAccountsSection
      userId="u-1"
      initialAccounts={allAccounts}
      allAccounts={allAccounts}
      onChange={onChange}
    />,
  );

  expect(screen.getByPlaceholderText("All accounts assigned")).toBeDisabled();
});
