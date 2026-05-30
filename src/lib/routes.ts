import { BookOpenIcon, BuildingIcon, ShoppingCartIcon, UsersIcon, HomeIcon } from "lucide-react";

export const adminNavItemsValue = [
  { label: "Home", to: "/manage/dashboard", icon: HomeIcon },
  { label: "Orders", to: "/manage/orders", icon: ShoppingCartIcon },
  { label: "Accounts", to: "/manage/accounts", icon: BuildingIcon },
  { label: "Users", to: "/manage/users", icon: UsersIcon },
] as const;

export const accountNavItemsValue = [
  { label: "Orders", to: "/accounts", icon: ShoppingCartIcon },
  { label: "Browse", to: "/browse", icon: BookOpenIcon },
] as const;
