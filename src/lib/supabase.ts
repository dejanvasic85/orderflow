import { createBrowserClient } from "@supabase/ssr";
import { getClientConfig } from "@/lib/config";
import type { Database } from "@/lib/database.types";

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = getClientConfig();

export const supabase = createBrowserClient<Database>(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
