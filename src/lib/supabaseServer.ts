import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { getConfig } from "@/lib/config";
import type { Database } from "@/lib/database.types";

export function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getConfig();
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => {

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
    },
  );
}
