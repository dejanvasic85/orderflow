import { createClient } from "@supabase/supabase-js";
import { getServerConfig } from "@/lib/config";
import type { Database } from "@/lib/database.types";

export function createSupabaseAdminClient() {
  const { VITE_SUPABASE_URL, SUPABASE_SECRET_KEY } = getServerConfig();
  return createClient<Database>(VITE_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
