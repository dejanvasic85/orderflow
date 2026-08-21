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

type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
type GetUserResult = Awaited<ReturnType<SupabaseServerClient["auth"]["getUser"]>>;
type GetSessionResult = Awaited<ReturnType<SupabaseServerClient["auth"]["getSession"]>>;

// Parallel server functions sharing a request can each try to refresh the same
// expired token; refresh tokens are single-use, so only the first wins and the
// rest fail "already used". Dedupe concurrent refreshes by cookie string.
export function singleFlight<T>(
  cache: Map<string, Promise<T>>,
  key: string,
  run: () => Promise<T>,
) {
  const inFlight = cache.get(key);
  if (inFlight) return inFlight;

  const promise = run().finally(() => cache.delete(key));
  cache.set(key, promise);
  return promise;
}

function cookieCacheKey(): string {
  return Object.entries(getCookies())
    .map(([name, value]) => `${name}=${value}`)
    .sort()
    .join("; ");
}

const inFlightGetUser = new Map<string, Promise<GetUserResult>>();

export function getAuthenticatedUser(supabase: SupabaseServerClient) {
  return singleFlight(inFlightGetUser, cookieCacheKey(), () => supabase.auth.getUser());
}

const inFlightGetSession = new Map<string, Promise<GetSessionResult>>();

export function getAuthSession(supabase: SupabaseServerClient) {
  return singleFlight(inFlightGetSession, cookieCacheKey(), () => supabase.auth.getSession());
}
