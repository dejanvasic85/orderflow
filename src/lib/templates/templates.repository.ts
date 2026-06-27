import { err, ok, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  AddTemplateItemInput,
  CreateTemplateInput,
  SaveTemplateItemsInput,
  TemplateItemRow,
  TemplateRow,
  TemplateWithItems,
  UpdateTemplateInput,
} from "./schema";

const templateWithItemsSelect =
  "id, account_id, name, created_by, created_at, updated_at, template_items(id, product_id, box_count, unit_count, created_by, created_at, products(id, name, qty_per_box))" as const;

type SaveBatchItem = SaveTemplateItemsInput["toAdd"][number];
type UpdateBatchItem = SaveTemplateItemsInput["toUpdate"][number];

export type TemplateRepository = {
  findTemplateForAccount(accountId: string): Promise<Result<TemplateWithItems | null>>;
  findTemplateById(id: string): Promise<Result<TemplateWithItems>>;
  createTemplate(data: CreateTemplateInput): Promise<Result<TemplateRow>>;
  updateTemplate(data: UpdateTemplateInput): Promise<Result<TemplateRow>>;
  createTemplateItem(data: AddTemplateItemInput): Promise<Result<TemplateItemRow>>;
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
      return ok(data as TemplateWithItems | null);
    },

    async findTemplateById(id) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("templates")
        .select(templateWithItemsSelect)
        .eq("id", id)
        .single();
      if (error) return err({ message: error.message });
      return ok(data as TemplateWithItems);
    },

    async createTemplate(data) {
      const supabase = createSupabaseServerClient();
      const { data: row, error } = await supabase.from("templates").insert(data).select().single();
      if (error) return err({ message: error.message });
      return ok(row);
    },

    async updateTemplate(data) {
      const supabase = createSupabaseServerClient();
      const { id, ...patch } = data;
      const { data: row, error } = await supabase
        .from("templates")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) return err({ message: error.message });
      return ok(row);
    },

    async createTemplateItem(data) {
      const supabase = createSupabaseServerClient();
      const { data: row, error } = await supabase
        .from("template_items")
        .insert(data)
        .select()
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
              toUpdate.map(({ id, box_count, unit_count }) =>
                supabase
                  .from("template_items")
                  .update({ box_count, unit_count })
                  .eq("template_id", templateId)
                  .eq("id", id)
                  .then((r) => r.error),
              ),
            ).then((errors) => errors.find(Boolean) ?? null)
          : Promise.resolve(null),
        toAdd.length > 0
          ? supabase
              .from("template_items")
              .insert(toAdd.map((item) => ({ ...item, template_id: templateId })))
              .then((r) => r.error)
          : Promise.resolve(null),
      ]);

      const firstError = [deleteError, updateError, insertError].find(Boolean);
      if (firstError) return err({ message: firstError.message });
      return ok();
    },
  };
}
