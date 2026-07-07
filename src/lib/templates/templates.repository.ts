import type { Database } from "@/lib/database.types";
import { err, ok, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  AddTemplateItemInput,
  CreateTemplateInput,
  SaveTemplateItemsInput,
  TemplateItem,
  TemplateWithItems,
  UpdateTemplateInput,
} from "./schema";

type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplateItemRow = Database["public"]["Tables"]["template_items"]["Row"];

const templateWithItemsSelect =
  "id, account_id, name, created_by, created_at, updated_at, template_items(id, product_id, box_count, unit_count, created_by, created_at, products(id, name, qty_per_box))" as const;

type TemplateItemJoinRow = TemplateItemRow & {
  products: { id: string; name: string; qty_per_box: number };
};

type TemplateWithItemsRow = TemplateRow & { template_items: TemplateItemJoinRow[] };

function toTemplateItem(row: TemplateItemJoinRow): TemplateItem {
  return {
    id: row.id,
    templateId: row.template_id,
    productId: row.product_id,
    boxCount: row.box_count,
    unitCount: row.unit_count,
    createdBy: row.created_by,
    createdAt: row.created_at,
    product: {
      id: row.products.id,
      name: row.products.name,
      qtyPerBox: row.products.qty_per_box,
    },
  };
}

function toTemplateWithItems(row: TemplateWithItemsRow): TemplateWithItems {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    templateItems: row.template_items.map(toTemplateItem),
  };
}

type SaveBatchItem = SaveTemplateItemsInput["toAdd"][number];
type UpdateBatchItem = SaveTemplateItemsInput["toUpdate"][number];

export type CreatedTemplate = { id: string; name: string };
export type CreatedTemplateItem = { id: string };

export type TemplateRepository = {
  findTemplateForAccount(accountId: string): Promise<Result<TemplateWithItems | null>>;
  findTemplateById(id: string): Promise<Result<TemplateWithItems>>;
  createTemplate(data: CreateTemplateInput): Promise<Result<CreatedTemplate>>;
  updateTemplate(data: UpdateTemplateInput): Promise<Result<CreatedTemplate>>;
  createTemplateItem(data: AddTemplateItemInput): Promise<Result<CreatedTemplateItem>>;
  deleteTemplateItem(id: string): Promise<Result<void>>;
  saveTemplateItemBatch(params: {
    templateId: string;
    toRemove: string[];
    toUpdate: UpdateBatchItem[];
    toAdd: SaveBatchItem[];
  }): Promise<Result<void>>;
};

export function createTemplateRepository(): TemplateRepository {
  return {
    async findTemplateForAccount(accountId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("templates")
        .select(templateWithItemsSelect)
        .eq("account_id", accountId)
        .maybeSingle();
      if (error) return err({ message: error.message });
      return ok(data ? toTemplateWithItems(data as TemplateWithItemsRow) : null);
    },

    async findTemplateById(id) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("templates")
        .select(templateWithItemsSelect)
        .eq("id", id)
        .single();
      if (error) return err({ message: error.message });
      return ok(toTemplateWithItems(data as TemplateWithItemsRow));
    },

    async createTemplate(data) {
      const supabase = createSupabaseServerClient();
      const { data: row, error } = await supabase
        .from("templates")
        .insert({ account_id: data.accountId, name: data.name })
        .select("id, name")
        .single();
      if (error) return err({ message: error.message });
      return ok(row);
    },

    async updateTemplate(data) {
      const supabase = createSupabaseServerClient();
      const { id, accountId, ...rest } = data;
      const { data: row, error } = await supabase
        .from("templates")
        .update({
          ...(accountId !== undefined && { account_id: accountId }),
          ...rest,
        })
        .eq("id", id)
        .select("id, name")
        .single();
      if (error) return err({ message: error.message });
      return ok(row);
    },

    async createTemplateItem(data) {
      const supabase = createSupabaseServerClient();
      const { data: row, error } = await supabase
        .from("template_items")
        .insert({
          template_id: data.templateId,
          product_id: data.productId,
          box_count: data.boxCount,
          unit_count: data.unitCount,
        })
        .select("id")
        .single();
      if (error) return err({ message: error.message });
      return ok(row);
    },

    async deleteTemplateItem(id) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.from("template_items").delete().eq("id", id);
      if (error) return err({ message: error.message });
      return ok();
    },

    // TODO(atomicity): replace with a single supabase.rpc() call backed by a Postgres function
    async saveTemplateItemBatch({ templateId, toRemove, toUpdate, toAdd }) {
      const supabase = createSupabaseServerClient();

      const [deleteError, updateError, insertError] = await Promise.all([
        toRemove.length > 0
          ? supabase
              .from("template_items")
              .delete()
              .eq("template_id", templateId)
              .in("id", toRemove)
              .then((r) => r.error)
          : Promise.resolve(null),
        toUpdate.length > 0
          ? Promise.all(
              toUpdate.map(({ id, boxCount, unitCount }) =>
                supabase
                  .from("template_items")
                  .update({ box_count: boxCount, unit_count: unitCount })
                  .eq("template_id", templateId)
                  .eq("id", id)
                  .then((r) => r.error),
              ),
            ).then((errors) => errors.find(Boolean) ?? null)
          : Promise.resolve(null),
        toAdd.length > 0
          ? supabase
              .from("template_items")
              .insert(
                toAdd.map((item) => ({
                  template_id: templateId,
                  product_id: item.productId,
                  box_count: item.boxCount,
                  unit_count: item.unitCount,
                })),
              )
              .then((r) => r.error)
          : Promise.resolve(null),
      ]);

      const firstError = [deleteError, updateError, insertError].find(Boolean);
      if (firstError) return err({ message: firstError.message });
      return ok();
    },
  };
}
