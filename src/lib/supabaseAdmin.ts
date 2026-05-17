import { createClient } from "@supabase/supabase-js";
import { getConfig } from "@/lib/config";
import type { Database } from "@/lib/database.types";

export function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseSecretKey } = getConfig();
  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
