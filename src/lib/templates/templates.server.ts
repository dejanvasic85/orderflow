import type { z } from "zod";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { assertAdmin } from "@/lib/users/users.server";
import type {
  addTemplateItemSchema,
  createTemplateSchema,
  replaceTemplateItemsSchema,
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

export async function replaceTemplateItemsForAccount(
  data: z.infer<typeof replaceTemplateItemsSchema>,
) {
  const supabase = createSupabaseServerClient();
  await assertAdmin(supabase);

  const existingResult = await fetchTemplateForAccount(data.account_id);
  if (!existingResult.ok) return existingResult;

  let templateId: string;

  if (!existingResult.value) {
    const insertResult = await insertTemplate({ account_id: data.account_id, name: "Default" });
    if (!insertResult.ok) return insertResult;
    templateId = insertResult.value.id;
  } else {
    templateId = existingResult.value.id;
  }

  const { error: deleteError } = await supabase
    .from("template_items")
    .delete()
    .eq("template_id", templateId);
  if (deleteError) return err({ message: deleteError.message });

  if (data.items.length > 0) {
    const rows = data.items.map((item) => ({
      template_id: templateId,
      product_id: item.product_id,
      box_count: item.box_count,
      bottle_count: item.bottle_count,
    }));
    const { error: insertError } = await supabase.from("template_items").insert(rows);
    if (insertError) return err({ message: insertError.message });
  }

  return fetchTemplate(templateId);
}
