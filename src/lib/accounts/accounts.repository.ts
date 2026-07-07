import type { Database } from "@/lib/database.types";
import { err, ok, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  Account,
  AccountUser,
  AssignAccountUserInput,
  CreateAccountInput,
  ListAccountsSearch,
  UpdateAccountInput,
} from "./schema";
import { accountPageSize } from "./schema";

type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];

const accountSelect =
  "id, name, contact_name, contact_email, contact_phone, delivery_address, delivery_instructions, created_at, updated_at, account_users!account_id ( user_id )" as const;

type AccountListedRow = AccountRow & {
  account_users: { user_id: string }[] | null;
};

type AccountUserRow = {
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

function toAccount(row: AccountListedRow): Account {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    deliveryAddress: row.delivery_address,
    deliveryInstructions: row.delivery_instructions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userCount: row.account_users?.length ?? 0,
  };
}

function toAccountUser(row: AccountUserRow): AccountUser {
  return {
    userId: row.user_id,
    createdAt: row.created_at,
    user: row.users,
  };
}

function toAccountInsert(input: CreateAccountInput) {
  return {
    name: input.name,
    contact_name: input.contactName ?? null,
    contact_email: input.contactEmail ?? null,
    contact_phone: input.contactPhone ?? null,
    delivery_address: input.deliveryAddress ?? null,
    delivery_instructions: input.deliveryInstructions ?? null,
  };
}

function toAccountUpdate(input: Omit<UpdateAccountInput, "id">) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.contactName !== undefined && { contact_name: input.contactName }),
    ...(input.contactEmail !== undefined && { contact_email: input.contactEmail }),
    ...(input.contactPhone !== undefined && { contact_phone: input.contactPhone }),
    ...(input.deliveryAddress !== undefined && { delivery_address: input.deliveryAddress }),
    ...(input.deliveryInstructions !== undefined && {
      delivery_instructions: input.deliveryInstructions,
    }),
  };
}

export type AccountRepository = {
  findAccountsForUser(userId: string): Promise<Result<{ id: string; name: string }[]>>;
  findPagedAccounts(
    filters: ListAccountsSearch,
  ): Promise<Result<{ accounts: Account[]; total: number }>>;
  findAccountById(id: string): Promise<Result<Account>>;
  findAccountUsers(accountId: string): Promise<Result<AccountUser[]>>;
  createAccount(data: CreateAccountInput): Promise<Result<Account>>;
  updateAccount(data: UpdateAccountInput): Promise<Result<Account>>;
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
        const safe = filters.q.replace(/[,%_()]/g, "").trim();
        if (safe.length > 0) {
          query = query.ilike("name", `%${safe}%`);
        }
      }

      const page = filters.page ?? 1;
      const from = (page - 1) * accountPageSize;
      query = query.range(from, from + accountPageSize - 1);

      const { data, error, count } = await query;
      if (error) return err({ message: error.message });
      const rows = (data ?? []) as AccountListedRow[];
      return ok({ accounts: rows.map(toAccount), total: count ?? 0 });
    },

    async findAccountById(id) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("accounts")
        .select(accountSelect)
        .eq("id", id)
        .single();
      if (error) return err({ message: error.message });
      return ok(toAccount(data as AccountListedRow));
    },

    async findAccountUsers(accountId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("account_users")
        .select("user_id, created_at, users:users_with_email(id, name, email, role, active)")
        .eq("account_id", accountId);
      if (error) return err({ message: error.message });
      const rows = (data ?? []) as AccountUserRow[];
      return ok(rows.map(toAccountUser));
    },

    async createAccount(data) {
      const supabase = createSupabaseServerClient();
      const { data: row, error } = await supabase
        .from("accounts")
        .insert(toAccountInsert(data))
        .select(accountSelect)
        .single();
      if (error) return err({ message: error.message });
      return ok(toAccount(row as AccountListedRow));
    },

    async updateAccount(data) {
      const supabase = createSupabaseServerClient();
      const { id, ...rest } = data;
      const { data: row, error } = await supabase
        .from("accounts")
        .update(toAccountUpdate(rest))
        .eq("id", id)
        .select(accountSelect)
        .single();
      if (error) return err({ message: error.message });
      return ok(toAccount(row as AccountListedRow));
    },

    async assignUserToAccount(data) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase
        .from("account_users")
        .insert({ account_id: data.accountId, user_id: data.userId });
      if (error) return err({ message: error.message });
      return ok();
    },

    async unassignUserFromAccount(data) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase
        .from("account_users")
        .delete()
        .eq("account_id", data.accountId)
        .eq("user_id", data.userId);
      if (error) return err({ message: error.message });
      return ok();
    },
  };
}
