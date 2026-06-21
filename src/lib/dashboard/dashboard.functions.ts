import { createServerFn } from "@tanstack/react-start";
import { assertAdminOrStaff } from "@/lib/auth/auth.server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createDashboardRepository } from "./dashboard.repository";
import { getDashboardData, type DashboardServiceDeps } from "./dashboard.service";

const deps: DashboardServiceDeps = {
  repo: createDashboardRepository(),
  authorize: () => assertAdminOrStaff(createSupabaseServerClient()),
};

export const getDashboardStats = createServerFn({
  method: "GET",
  strict: { output: false },
}).handler(async () => getDashboardData(deps));
