import { BookOpenIcon, ShoppingCartIcon, UsersIcon } from "lucide-react";

export const adminNavItemsValue = [
  { label: "Orders", to: "/manage/orders", icon: ShoppingCartIcon },
  { label: "Users", to: "/manage/users", icon: UsersIcon },
] as const;

export const accountNavItemsValue = [
  { label: "Orders", to: "/accounts", icon: ShoppingCartIcon },
  { label: "Browse", to: "/browse", icon: BookOpenIcon },
] as const;
