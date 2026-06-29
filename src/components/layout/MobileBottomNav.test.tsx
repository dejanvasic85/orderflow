import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BookOpenIcon,
  LayoutGridIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "lucide-react";
import { MobileBottomNav } from "./MobileBottomNav";

const onSignOut = vi.fn();

const navItems = [
  { label: "Orders", to: "/accounts/abc", icon: ShoppingCartIcon },
  { label: "Browse", to: "/browse", icon: BookOpenIcon },
] as const;

const manageGroup = {
  label: "Manage",
  icon: LayoutGridIcon,
  items: [
    { label: "Products", to: "/manage/products", icon: PackageIcon },
    { label: "Users", to: "/manage/users", icon: UsersIcon },
  ],
} as const;

function renderWithRouter(ui: React.ReactNode, { initialPath }: { initialPath?: string } = {}) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath ?? "/"] }),
  });
  return render(<RouterProvider router={router} />);
}

function renderNav(
  overrides?: Partial<React.ComponentProps<typeof MobileBottomNav>> & { initialPath?: string },
) {
  const { initialPath, ...props } = overrides ?? {};
  return renderWithRouter(
    <MobileBottomNav
      email="tom@bwow.com.au"
      navItems={navItems}
      hasMultipleAccounts={false}
      onSignOut={onSignOut}
      {...props}
    />,
    { initialPath },
  );
}

test("renders all nav item links", async () => {
  renderNav();
  expect(await screen.findByRole("link", { name: /orders/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /browse/i })).toBeInTheDocument();
});

test("renders accessible trigger for account menu", async () => {
  renderNav();
  expect(await screen.findByRole("button", { name: "Open account menu" })).toBeInTheDocument();
});

test("does not show Change account when hasMultipleAccounts is false", async () => {
  const user = userEvent.setup();
  renderNav({ hasMultipleAccounts: false });

  await user.click(await screen.findByRole("button", { name: "Open account menu" }));

  expect(screen.queryByRole("link", { name: "Change account" })).not.toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Sign out" })).toBeInTheDocument();
});

test("shows Change account when hasMultipleAccounts is true", async () => {
  const user = userEvent.setup();
  renderNav({ hasMultipleAccounts: true });

  await user.click(await screen.findByRole("button", { name: "Open account menu" }));

  expect(await screen.findByRole("link", { name: "Change account" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
});

test("shows Change password link to /change-password", async () => {
  const user = userEvent.setup();
  renderNav();

  await user.click(await screen.findByRole("button", { name: "Open account menu" }));

  const link = await screen.findByRole("link", { name: "Change password" });
  expect(link).toHaveAttribute("href", "/change-password");
});

test("shows Settings link to /settings", async () => {
  const user = userEvent.setup();
  renderNav();

  await user.click(await screen.findByRole("button", { name: "Open account menu" }));

  const link = await screen.findByRole("link", { name: "Settings" });
  expect(link).toHaveAttribute("href", "/settings");
});

test("calls onSignOut when Sign out is clicked", async () => {
  const user = userEvent.setup();
  renderNav();

  await user.click(await screen.findByRole("button", { name: "Open account menu" }));
  await user.click(await screen.findByRole("button", { name: "Sign out" }));

  expect(onSignOut).toHaveBeenCalledTimes(1);
});

test("does not render a Manage tab when no manageGroup is provided", async () => {
  renderNav();

  await screen.findByRole("button", { name: "Open account menu" });
  expect(screen.queryByRole("button", { name: "Open manage menu" })).not.toBeInTheDocument();
});

test("renders a Manage tab when manageGroup is provided", async () => {
  renderNav({ manageGroup });

  expect(await screen.findByRole("button", { name: "Open manage menu" })).toBeInTheDocument();
});

test("opens the manage sheet and shows grouped links", async () => {
  const user = userEvent.setup();
  renderNav({ manageGroup });

  await user.click(await screen.findByRole("button", { name: "Open manage menu" }));

  const productsLink = await screen.findByRole("link", { name: "Products" });
  expect(productsLink).toHaveAttribute("href", "/manage/products");
  expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/manage/users");
});

test("highlights the Manage tab when on a grouped route", async () => {
  renderNav({ manageGroup, initialPath: "/manage/products" });

  const manageTab = await screen.findByRole("button", { name: "Open manage menu" });
  expect(manageTab).toHaveTextContent("Manage");
  expect(manageTab.querySelector("span.font-semibold")).not.toBeNull();
});
