import type { z } from "zod";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { addTemplateItemSchema, createTemplateSchema, updateTemplateSchema } from "./schema";

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
