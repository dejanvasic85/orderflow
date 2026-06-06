import type { z } from "zod";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { assertAdmin } from "@/lib/users/users.server";
import type {
  addTemplateItemSchema,
  createTemplateSchema,
  saveTemplateItemsSchema,
  updateTemplateSchema,
} from "./schema";

const templateWithItemsSelect =
  "id, account_id, name, created_by, created_at, updated_at, template_items(id, product_id, box_count, bottle_count, created_by, created_at, products(id, name, qty_per_box))" as const;

export async function fetchTemplateForAccount(accountId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("templates")
    .select(templateWithItemsSelect)
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) return err({ message: error.message });
  return ok(data);
}

export async function fetchTemplate(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("templates")
    .select(templateWithItemsSelect)
    .eq("id", id)
    .single();
  if (error) return err({ message: error.message });
  return ok(data);
}

export async function insertTemplate(data: z.infer<typeof createTemplateSchema>) {
  const supabase = createSupabaseServerClient();
  const { data: row, error } = await supabase.from("templates").insert(data).select().single();
  if (error) return err({ message: error.message });
  return ok(row);
}

export async function patchTemplate(data: z.infer<typeof updateTemplateSchema>) {
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
}

export async function insertTemplateItem(data: z.infer<typeof addTemplateItemSchema>) {
  const supabase = createSupabaseServerClient();
  const { data: row, error } = await supabase.from("template_items").insert(data).select().single();
  if (error) return err({ message: error.message });
  return ok(row);
}

export async function deleteTemplateItem(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("template_items").delete().eq("id", id);
  if (error) return err({ message: error.message });
  return ok();
}

async function ensureTemplateId(accountId: string): Promise<Result<string>> {
  const existing = await fetchTemplateForAccount(accountId);
  if (!existing.ok) return existing;
  if (existing.value) return ok(existing.value.id);
  const created = await insertTemplate({ account_id: accountId, name: "Default" });
  if (!created.ok) return created;
  return ok(created.value.id);
}

export async function saveTemplateItemsForAccount(data: z.infer<typeof saveTemplateItemsSchema>) {
  const supabase = createSupabaseServerClient();
  await assertAdmin(supabase);

  const templateIdResult = await ensureTemplateId(data.account_id);
  if (!templateIdResult.ok) return templateIdResult;
  const templateId = templateIdResult.value;

  const [deleteError, updateError, insertError] = await Promise.all([
    data.toRemove.length > 0
      ? supabase
          .from("template_items")
          .delete()
          .in("id", data.toRemove)
          .then((r) => r.error)
      : Promise.resolve(null),
    data.toUpdate.length > 0
      ? Promise.all(
          data.toUpdate.map(({ id, box_count, bottle_count }) =>
            supabase
              .from("template_items")
              .update({ box_count, bottle_count })
              .eq("id", id)
              .then((r) => r.error),
          ),
        ).then((errors) => errors.find(Boolean) ?? null)
      : Promise.resolve(null),
    data.toAdd.length > 0
      ? supabase
          .from("template_items")
          .insert(data.toAdd.map((item) => ({ ...item, template_id: templateId })))
          .then((r) => r.error)
      : Promise.resolve(null),
  ]);

  const firstError = [deleteError, updateError, insertError].find(Boolean);
  if (firstError) return err({ message: firstError.message });

  return ok();
}
