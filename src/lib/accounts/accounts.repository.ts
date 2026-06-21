import { err, ok, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  AccountRow,
  AssignAccountUserInput,
  CreateAccountInput,
  ListAccountsSearch,
  UpdateAccountInput,
} from "./schema";
import { accountPageSize } from "./schema";

const accountSelect =
  "id, name, contact_name, contact_email, contact_phone, delivery_address, delivery_instructions, created_at, updated_at, account_users!account_id ( user_id )" as const;

export type AccountListedRow = AccountRow & {
  account_users: { user_id: string }[] | null;
};

export type AccountUserRow = {
  user_id: string;
  created_at: string;
  users: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
    active: boolean | null;
  } | null;
};

export type AccountRepository = {
  findAccountsForUser(userId: string): Promise<Result<{ id: string; name: string }[]>>;
  findPagedAccounts(
    filters: ListAccountsSearch,
  ): Promise<Result<{ accounts: AccountListedRow[]; total: number }>>;
  findAccountById(id: string): Promise<Result<AccountListedRow>>;
  findAccountUsers(accountId: string): Promise<Result<AccountUserRow[]>>;
  createAccount(data: CreateAccountInput): Promise<Result<AccountRow>>;
  updateAccount(data: UpdateAccountInput): Promise<Result<AccountRow>>;
  assignUserToAccount(data: AssignAccountUserInput): Promise<Result<void>>;
  unassignUserFromAccount(data: AssignAccountUserInput): Promise<Result<void>>;
};

export function createAccountRepository(): AccountRepository {
  return {
    async findAccountsForUser(userId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("account_users")
        .select("account:accounts(id, name)")
        .eq("user_id", userId);
      if (error) return err({ message: error.message });
      const accounts = (data ?? [])
        .map((r) => r.account)
        .filter((a): a is { id: string; name: string } => a !== null);
      return ok(accounts);
    },

    async findPagedAccounts(filters) {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from("accounts")
        .select(accountSelect, { count: "exact" })
        .order("name", { ascending: true });

      if (filters.q) {
        const safe = filters.q.replace(/[%_()]/g, "");
        query = query.ilike("name", `%${safe}%`);
      }

      if (filters.page !== undefined) {
        const from = (filters.page - 1) * accountPageSize;
        query = query.range(from, from + accountPageSize - 1);
      }

      const { data, error, count } = await query;
      if (error) return err({ message: error.message });
      return ok({ accounts: (data ?? []) as AccountListedRow[], total: count ?? 0 });
    },

    async findAccountById(id) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("accounts")
        .select(accountSelect)
        .eq("id", id)
        .single();
      if (error) return err({ message: error.message });
      return ok(data as AccountListedRow);
    },

    async findAccountUsers(accountId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("account_users")
        .select("user_id, created_at, users:users_with_email(id, name, email, role, active)")
        .eq("account_id", accountId);
      if (error) return err({ message: error.message });
      return ok((data ?? []) as AccountUserRow[]);
    },

    async createAccount(data) {
      const supabase = createSupabaseServerClient();
      const { data: row, error } = await supabase.from("accounts").insert(data).select().single();
      if (error) return err({ message: error.message });
      return ok(row);
    },

    async updateAccount(data) {
      const supabase = createSupabaseServerClient();
      const { id, ...patch } = data;
      const { data: row, error } = await supabase
        .from("accounts")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) return err({ message: error.message });
      return ok(row);
    },

    async assignUserToAccount(data) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.from("account_users").insert(data);
      if (error) return err({ message: error.message });
      return ok();
    },

    async unassignUserFromAccount(data) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase
        .from("account_users")
        .delete()
        .eq("account_id", data.account_id)
        .eq("user_id", data.user_id);
      if (error) return err({ message: error.message });
      return ok();
    },
  };
}
