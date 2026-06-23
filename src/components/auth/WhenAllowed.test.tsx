import { useRouteContext } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { permissions } from "@/lib/permissions";
import { WhenAllowed } from "./WhenAllowed";

vi.mock("@tanstack/react-router", () => ({
  useRouteContext: vi.fn(),
}));

function renderWithRole(role: string | undefined) {
  vi.mocked(useRouteContext).mockReturnValue({ user: { user_role: role } });
  return render(
    <WhenAllowed permission={permissions.users.write}>
      <span>secret action</span>
    </WhenAllowed>,
  );
}

describe("WhenAllowed", () => {
  it("renders children when user has the permission", () => {
    renderWithRole("admin");
    expect(screen.getByText("secret action")).toBeInTheDocument();
  });

  it("renders nothing when user lacks the permission", () => {
    renderWithRole("staff");
    expect(screen.queryByText("secret action")).not.toBeInTheDocument();
  });

  it("renders nothing for user role", () => {
    renderWithRole("user");
    expect(screen.queryByText("secret action")).not.toBeInTheDocument();
  });

  it("renders nothing when user_role is undefined", () => {
    renderWithRole(undefined);
    expect(screen.queryByText("secret action")).not.toBeInTheDocument();
  });
});
