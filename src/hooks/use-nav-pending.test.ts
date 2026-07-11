import { useRouterState } from "@tanstack/react-router";
import { renderHook } from "@testing-library/react";
import { useNavPending } from "./use-nav-pending";

vi.mock("@tanstack/react-router", () => ({
  useRouterState: vi.fn(),
}));

// useNavPending reads two slices: isLoading and (when loading) the pathname.
// This helper drives both selectors to simulate an in-flight navigation.
function mockNavigatingTo(pathname: string) {
  vi.mocked(useRouterState).mockImplementation((opts) =>
    // @ts-expect-error — the real selector is typed against the full router state
    opts.select({ isLoading: true, location: { pathname } }),
  );
}

test("reports the exact target as pending", () => {
  mockNavigatingTo("/accounts/abc/orders/new");

  const { result } = renderHook(() => useNavPending());

  expect(result.current("/accounts/abc/orders/new")).toBe(true);
});

test("without siblings, a prefix parent also matches (nested-route highlighting)", () => {
  mockNavigatingTo("/accounts/abc/orders/new");

  const { result } = renderHook(() => useNavPending());

  expect(result.current("/accounts/abc")).toBe(true);
});

test("with siblings, only the most specific matching sibling is pending", () => {
  mockNavigatingTo("/accounts/abc/orders/new");
  const siblings = ["/accounts/abc", "/accounts/abc/orders/new", "/accounts/abc/browse"];

  const { result } = renderHook(() => useNavPending());

  expect(result.current("/accounts/abc/orders/new", siblings)).toBe(true);
});

test("with siblings, a prefix parent sibling is not pending", () => {
  mockNavigatingTo("/accounts/abc/orders/new");
  const siblings = ["/accounts/abc", "/accounts/abc/orders/new", "/accounts/abc/browse"];

  const { result } = renderHook(() => useNavPending());

  expect(result.current("/accounts/abc", siblings)).toBe(false);
});

test("with siblings, an unrelated sibling is not pending", () => {
  mockNavigatingTo("/accounts/abc/orders/new");
  const siblings = ["/accounts/abc", "/accounts/abc/orders/new", "/accounts/abc/browse"];

  const { result } = renderHook(() => useNavPending());

  expect(result.current("/accounts/abc/browse", siblings)).toBe(false);
});
