import { BookOpenIcon, ShoppingCartIcon, UsersIcon } from "lucide-react";

export const adminNavItemsValue = [
  { label: "Orders", to: "/accounts", icon: ShoppingCartIcon },
  { label: "Users", to: "/users", icon: UsersIcon },
] as const;

export const accountNavItemsValue = [
  { label: "Orders", to: "/accounts", icon: ShoppingCartIcon },
  { label: "Browse", to: "/browse", icon: BookOpenIcon },
] as const;
