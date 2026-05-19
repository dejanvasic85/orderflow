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

test("exchanges hash access_token and navigates to set-password for invite type", async () => {
  const { supabase, setSession } = makeSupabase();
  const navigate = vi.fn().mockResolvedValue(undefined);
  const setError = vi.fn();

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "#access_token=tok123&refresh_token=ref456&type=invite",
    effectiveType: "invite",
    navigate,
    setError,
  });

  await vi.runAllTimersAsync();
  await promise;

  expect(setSession).toHaveBeenCalledWith({
    access_token: "tok123",
    refresh_token: "ref456",
  });
  expect(navigate).toHaveBeenCalledWith("/auth/set-password");
  expect(setError).not.toHaveBeenCalled();
});

test("exchanges hash access_token and navigates to dashboard for non-invite type", async () => {
  const { supabase } = makeSupabase();
  const navigate = vi.fn().mockResolvedValue(undefined);
  const setError = vi.fn();

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "#access_token=tok123&refresh_token=ref456",
    effectiveType: null,
    navigate,
    setError,
  });

  await vi.runAllTimersAsync();
  await promise;

  expect(navigate).toHaveBeenCalledWith("/dashboard");
  expect(setError).not.toHaveBeenCalled();
});

test("calls setError when setSession fails", async () => {
  const failingSetSession = vi
    .fn()
    .mockResolvedValue({ data: {}, error: { message: "Token expired" } });
  const { supabase } = makeSupabase({ setSession: failingSetSession });
  const navigate = vi.fn();
  const setError = vi.fn();

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "#access_token=bad&refresh_token=ref",
    effectiveType: "invite",
    navigate,
    setError,
  });

  await vi.runAllTimersAsync();
  await promise;

  expect(setError).toHaveBeenCalledWith("Token expired");
  expect(navigate).not.toHaveBeenCalled();
});

test("exchanges code for session and navigates to set-password for invite type", async () => {
  const { supabase, exchangeCodeForSession } = makeSupabase();
  const navigate = vi.fn().mockResolvedValue(undefined);
  const setError = vi.fn();

  const promise = verifyCallback({
    supabase,
    code: "pkce-code-abc",
    hash: "",
    effectiveType: "invite",
    navigate,
    setError,
  });

  await vi.runAllTimersAsync();
  await promise;

  expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code-abc");
  expect(navigate).toHaveBeenCalledWith("/auth/set-password");
  expect(setError).not.toHaveBeenCalled();
});

test("exchanges code for session and navigates to dashboard for non-invite type", async () => {
  const { supabase } = makeSupabase();
  const navigate = vi.fn().mockResolvedValue(undefined);
  const setError = vi.fn();

  const promise = verifyCallback({
    supabase,
    code: "pkce-code-abc",
    hash: "",
    effectiveType: null,
    navigate,
    setError,
  });

  await vi.runAllTimersAsync();
  await promise;

  expect(navigate).toHaveBeenCalledWith("/dashboard");
});

test("calls setError when exchangeCodeForSession fails", async () => {
  const failingExchange = vi
    .fn()
    .mockResolvedValue({ data: {}, error: { message: "Invalid code" } });
  const { supabase } = makeSupabase({ exchangeCodeForSession: failingExchange });
  const navigate = vi.fn();
  const setError = vi.fn();

  const promise = verifyCallback({
    supabase,
    code: "bad-code",
    hash: "",
    effectiveType: null,
    navigate,
    setError,
  });

  await vi.runAllTimersAsync();
  await promise;

  expect(setError).toHaveBeenCalledWith("Invalid code");
  expect(navigate).not.toHaveBeenCalled();
});

test("calls setError when no code and no hash token", async () => {
  const { supabase } = makeSupabase();
  const navigate = vi.fn();
  const setError = vi.fn();

  const promise = verifyCallback({
    supabase,
    code: undefined,
    hash: "",
    effectiveType: null,
    navigate,
    setError,
  });

  await vi.runAllTimersAsync();
  await promise;

  expect(setError).toHaveBeenCalledWith(
    "Invalid or missing verification code. The link may have expired.",
  );
  expect(navigate).not.toHaveBeenCalled();
});
