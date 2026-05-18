import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePassword } from "./setPasswordUpdate";

function makeSupabase(overrides?: Partial<SupabaseClient["auth"]>) {
  const updateUser = vi.fn().mockResolvedValue({ data: {}, error: null });
  const supabase = {
    auth: { updateUser, ...overrides },
  } as unknown as SupabaseClient;
  return { supabase, updateUser };
}

test("updates password and navigates on success", async () => {
  const { supabase, updateUser } = makeSupabase();
  const navigate = vi.fn().mockResolvedValue(undefined);

  const result = await updatePassword({ supabase, password: "newpass123", navigate });

  expect(updateUser).toHaveBeenCalledWith({ password: "newpass123" });
  expect(navigate).toHaveBeenCalled();
  expect(result).toBeUndefined();
});

test("returns error and does not navigate when updateUser fails", async () => {
  const failingUpdateUser = vi
    .fn()
    .mockResolvedValue({ data: {}, error: { message: "Auth session missing" } });
  const { supabase } = makeSupabase({ updateUser: failingUpdateUser });
  const navigate = vi.fn();

  const result = await updatePassword({ supabase, password: "newpass123", navigate });

  expect(result).toEqual({ error: "Auth session missing" });
  expect(navigate).not.toHaveBeenCalled();
});
