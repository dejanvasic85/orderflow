import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { getClientConfig } from "@/lib/config";
import type { Database } from "@/lib/database.types";

export function createSupabaseServerClient() {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = getClientConfig();
  return createServerClient<Database>(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => {
        const cookies = getCookies();
        return Object.entries(cookies).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options);
        });
      },
    },
  });
}
