import type { UserRole } from "@/lib/users/schema";

export type RoleInfo = {
  label: string;
  summary: string;
  capabilities: string[];
};

export const roleInfoValue: Record<UserRole, RoleInfo> = {
  admin: {
    label: "Admin",
    summary: "Full read and write access",
    capabilities: [
      "Read and write access to all system features",
      "Manage users, roles, and account assignments",
      "Can be assigned to multiple accounts",
    ],
  },
  staff: {
    label: "Staff",
    summary: "Read-only, can submit orders",
    capabilities: [
      "Read-only access to accounts and users",
      "Able to submit orders on behalf of any account",
      "Can be assigned to multiple accounts",
    ],
  },
  user: {
    label: "User",
    summary: "Account user or sales rep",
    capabilities: [
      "Standard account user, including sales reps and managers",
      "Access limited to their assigned account",
      "Cannot be assigned to multiple accounts",
    ],
  },
};
