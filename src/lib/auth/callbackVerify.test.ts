import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyCallback } from "./callbackVerify";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function makeSupabase(overrides?: Partial<SupabaseClient["auth"]>) {
  const setSession = vi.fn().mockResolvedValue({ data: {}, error: null });
  const exchangeCodeForSession = vi.fn().mockResolvedValue({ data: {}, error: null });
  const supabase = {
    auth: { setSession, exchangeCodeForSession, ...overrides },
  } as unknown as SupabaseClient;
  return { supabase, setSession, exchangeCodeForSession };
}

test("exchanges hash access_token and returns set-password path for invite type", async () => {
  const { supabase, setSession } = makeSupabase();

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "#access_token=tok123&refresh_token=ref456&type=invite",
    effectiveType: "invite",
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(setSession).toHaveBeenCalledWith({
    access_token: "tok123",
    refresh_token: "ref456",
  });
  expect(result).toEqual({ status: "navigate", path: "/auth/set-password" });
});

test("exchanges hash access_token and returns dashboard path for unknown type", async () => {
  const { supabase } = makeSupabase();

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "#access_token=tok123&refresh_token=ref456",
    effectiveType: null,
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(result).toEqual({ status: "navigate", path: "/dashboard" });
});

test("exchanges hash access_token and returns dashboard path for recovery type", async () => {
  const { supabase } = makeSupabase();

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "#access_token=tok123&refresh_token=ref456&type=recovery",
    effectiveType: "recovery",
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(result).toEqual({ status: "navigate", path: "/dashboard" });
});

test("returns error status when setSession fails", async () => {
  const failingSetSession = vi
    .fn()
    .mockResolvedValue({ data: {}, error: { message: "Token expired" } });
  const { supabase } = makeSupabase({ setSession: failingSetSession });

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "#access_token=bad&refresh_token=ref",
    effectiveType: "invite",
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(result).toEqual({ status: "error" });
});

test("exchanges code for session and returns set-password path for invite type", async () => {
  const { supabase, exchangeCodeForSession } = makeSupabase();

  const promise = verifyCallback({
    supabase,
    code: "pkce-code-abc",
    hash: "",
    effectiveType: "invite",
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code-abc");
  expect(result).toEqual({ status: "navigate", path: "/auth/set-password" });
});

test("exchanges code for session and returns dashboard path for unknown type", async () => {
  const { supabase } = makeSupabase();

  const promise = verifyCallback({
    supabase,
    code: "pkce-code-abc",
    hash: "",
    effectiveType: null,
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(result).toEqual({ status: "navigate", path: "/dashboard" });
});

test("exchanges code for session and returns dashboard path for recovery type", async () => {
  const { supabase, exchangeCodeForSession } = makeSupabase();

  const promise = verifyCallback({
    supabase,
    code: "pkce-code-abc",
    hash: "",
    effectiveType: "recovery",
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code-abc");
  expect(result).toEqual({ status: "navigate", path: "/dashboard" });
});

test("returns error status when exchangeCodeForSession fails", async () => {
  const failingExchange = vi
    .fn()
    .mockResolvedValue({ data: {}, error: { message: "Invalid code" } });
  const { supabase } = makeSupabase({ exchangeCodeForSession: failingExchange });

  const promise = verifyCallback({
    supabase,
    code: "bad-code",
    hash: "",
    effectiveType: null,
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(result).toEqual({ status: "error" });
});

test("returns error status when no code and no hash token", async () => {
  const { supabase } = makeSupabase();

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "",
    effectiveType: null,
  });

  await vi.runAllTimersAsync();
  const result = await promise;

  expect(result).toEqual({ status: "error" });
});
