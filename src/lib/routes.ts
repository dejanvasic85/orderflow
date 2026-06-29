import {
  BuildingIcon,
  LayoutGridIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  HomeIcon,
} from "lucide-react";

export const adminNavItemsValue = [
  { label: "Home", to: "/manage/dashboard", icon: HomeIcon },
  { label: "Orders", to: "/manage/orders", icon: ShoppingCartIcon },
  { label: "Products", to: "/manage/products", icon: PackageIcon },
  { label: "Accounts", to: "/manage/accounts", icon: BuildingIcon },
  { label: "Users", to: "/manage/users", icon: UsersIcon },
] as const;

// Mobile bottom nav keeps the bar to four slots: two direct links plus a
// "Manage" sheet that groups the lower-frequency admin routes.
export const adminMobileNavItemsValue = [
  { label: "Home", to: "/manage/dashboard", icon: HomeIcon },
  { label: "Orders", to: "/manage/orders", icon: ShoppingCartIcon },
] as const;

export const adminManageGroupValue = {
  label: "Manage",
  icon: LayoutGridIcon,
  items: [
    { label: "Products", to: "/manage/products", icon: PackageIcon },
    { label: "Accounts", to: "/manage/accounts", icon: BuildingIcon },
    { label: "Users", to: "/manage/users", icon: UsersIcon },
  ],
} as const;
