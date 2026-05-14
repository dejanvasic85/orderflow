import { ShoppingCartIcon, UsersIcon } from "lucide-react";

export const navItemsValue = [
  { label: "Orders", to: "/dashboard", icon: ShoppingCartIcon },
  { label: "Users", to: "/users", icon: UsersIcon },
] as const;
