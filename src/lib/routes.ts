import { BuildingIcon, PackageIcon, ShoppingCartIcon, UsersIcon, HomeIcon } from "lucide-react";

export const adminNavItemsValue = [
  { label: "Home", to: "/manage/dashboard", icon: HomeIcon },
  { label: "Orders", to: "/manage/orders", icon: ShoppingCartIcon },
  { label: "Products", to: "/manage/products", icon: PackageIcon },
  { label: "Accounts", to: "/manage/accounts", icon: BuildingIcon },
  { label: "Users", to: "/manage/users", icon: UsersIcon },
] as const;
