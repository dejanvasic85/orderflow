import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountCombobox } from "./AccountCombobox";

const accounts = [
  { id: "1", name: "Acme Corp" },
  { id: "2", name: "Globex Inc" },
  { id: "3", name: "Initech" },
];

describe("AccountCombobox", () => {
  it("shows placeholder when no account is selected", () => {
    render(<AccountCombobox accounts={accounts} selectedId={null} onSelect={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Select an account...");
  });

  it("shows selected account name when an id is provided", () => {
    render(<AccountCombobox accounts={accounts} selectedId="2" onSelect={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Globex Inc");
  });

  it("opens the dropdown and lists all accounts when triggered", async () => {
    const user = userEvent.setup();
    render(<AccountCombobox accounts={accounts} selectedId={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Globex Inc")).toBeInTheDocument();
    expect(screen.getByText("Initech")).toBeInTheDocument();
  });

  it("calls onSelect with the account id when an item is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AccountCombobox accounts={accounts} selectedId={null} onSelect={onSelect} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Acme Corp"));

    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("closes the dropdown after selecting an account", async () => {
    const user = userEvent.setup();
    render(<AccountCombobox accounts={accounts} selectedId={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Globex Inc"));

    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });

  it("filters accounts by search input", async () => {
    const user = userEvent.setup();
    render(<AccountCombobox accounts={accounts} selectedId={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search accounts..."), "glob");

    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
    expect(screen.getByText("Globex Inc")).toBeInTheDocument();
  });

  it("shows empty message when search yields no results", async () => {
    const user = userEvent.setup();
    render(<AccountCombobox accounts={accounts} selectedId={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search accounts..."), "zzz");

    expect(screen.getByText("No accounts found.")).toBeInTheDocument();
  });
});
