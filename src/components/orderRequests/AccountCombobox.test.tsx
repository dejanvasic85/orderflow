import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { listAccounts } from "@/lib/accounts/accounts.functions";
import { makeAccount } from "@/test/fixtures/accountFixtures";
import { AccountCombobox } from "./AccountCombobox";

vi.mock("@/lib/accounts/accounts.functions", () => ({
  listAccounts: vi.fn(),
}));

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("AccountCombobox", () => {
  beforeEach(() => {
    vi.mocked(listAccounts).mockResolvedValue({
      ok: true,
      value: {
        accounts: [
          makeAccount({ id: "1", name: "Acme Corp" }),
          makeAccount({ id: "2", name: "Globex Inc" }),
        ],
        total: 2,
      },
    });
  });

  it("shows placeholder when no account is selected", () => {
    renderWithClient(<AccountCombobox selected={null} onSelect={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Select an account...");
  });

  it("shows the selected account name", () => {
    renderWithClient(
      <AccountCombobox selected={{ id: "2", name: "Globex Inc" }} onSelect={vi.fn()} />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Globex Inc");
  });

  it("does not query accounts before the dropdown is opened", () => {
    renderWithClient(<AccountCombobox selected={null} onSelect={vi.fn()} />);

    expect(listAccounts).not.toHaveBeenCalled();
  });

  it("lists accounts returned by the server when opened", async () => {
    const user = userEvent.setup();
    renderWithClient(<AccountCombobox selected={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Globex Inc")).toBeInTheDocument();
  });

  it("sends the typed search term to the server", async () => {
    const user = userEvent.setup();
    renderWithClient(<AccountCombobox selected={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search accounts..."), "primrose");

    await vi.waitFor(() => {
      expect(listAccounts).toHaveBeenCalledWith({ data: { q: "primrose" } });
    });
  });

  it("renders server results that the client list did not contain", async () => {
    const user = userEvent.setup();
    vi.mocked(listAccounts).mockResolvedValue({
      ok: true,
      value: {
        accounts: [makeAccount({ id: "9", name: "Primrose Bakery" })],
        total: 1,
      },
    });
    renderWithClient(<AccountCombobox selected={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search accounts..."), "primrose");

    expect(await screen.findByText("Primrose Bakery")).toBeInTheDocument();
  });

  it("shows the searching indicator while a new search is in flight", async () => {
    const user = userEvent.setup();
    renderWithClient(<AccountCombobox selected={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    await screen.findByText("Acme Corp");
    vi.mocked(listAccounts).mockReturnValue(new Promise(() => {}));
    await user.type(screen.getByPlaceholderText("Search accounts..."), "primrose");

    expect(await screen.findByText("Searching...")).toBeInTheDocument();
  });

  it("calls onSelect with the account id when an item is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithClient(<AccountCombobox selected={null} onSelect={onSelect} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Acme Corp"));

    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("closes the dropdown after selecting an account", async () => {
    const user = userEvent.setup();
    renderWithClient(<AccountCombobox selected={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Globex Inc"));

    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });

  it("shows empty message when the server returns no matches", async () => {
    const user = userEvent.setup();
    vi.mocked(listAccounts).mockResolvedValue({
      ok: true,
      value: { accounts: [], total: 0 },
    });
    renderWithClient(<AccountCombobox selected={null} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("No accounts found.")).toBeInTheDocument();
  });
});
