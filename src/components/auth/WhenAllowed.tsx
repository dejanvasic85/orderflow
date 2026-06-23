import { useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { can, type Permission } from "@/lib/permissions";

type Props = {
  permission: Permission;
  children: ReactNode;
};

export function WhenAllowed({ permission, children }: Props) {
  const { user } = useRouteContext({ from: "/_protected" });
  if (!can(user.user_role, permission)) return null;
  return <>{children}</>;
}
