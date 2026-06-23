export const permissions = {
  users: {
    write: "write:users",
    invite: "invite:users",
    changePassword: "change_password:users",
  },
  accounts: {
    write: "write:accounts",
    manageUsers: "manage_users:accounts",
  },
  products: {
    write: "write:products",
  },
  templates: {
    write: "write:templates",
  },
  orders: {
    place: "place:orders",
  },
} as const;

export type Permission =
  | (typeof permissions.users)[keyof typeof permissions.users]
  | (typeof permissions.accounts)[keyof typeof permissions.accounts]
  | (typeof permissions.products)[keyof typeof permissions.products]
  | (typeof permissions.templates)[keyof typeof permissions.templates]
  | (typeof permissions.orders)[keyof typeof permissions.orders];

type UserRole = "admin" | "staff" | "user";

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    permissions.users.write,
    permissions.users.invite,
    permissions.users.changePassword,
    permissions.accounts.write,
    permissions.accounts.manageUsers,
    permissions.products.write,
    permissions.templates.write,
    permissions.orders.place,
  ],
  staff: [permissions.orders.place],
  user: [permissions.orders.place],
};

function isUserRole(role: string): role is UserRole {
  return Object.hasOwn(rolePermissions, role);
}

export function can(role: string | undefined, permission: Permission): boolean {
  if (!role || !isUserRole(role)) return false;
  return rolePermissions[role].includes(permission);
}
