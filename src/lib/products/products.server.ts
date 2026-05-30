import type { z } from "zod";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { createProductSchema, updateProductSchema } from "./schema";

const productSelect =
  "id, name, description, image_url, qty_per_box, active, created_at, updated_at" as const;

export async function fetchProducts() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) return err({ message: error.message });
  return ok(data ?? []);
}

export async function fetchProduct(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("id", id)
    .single();
  if (error) return err({ message: error.message });
  return ok(data);
}

export async function insertProduct(data: z.infer<typeof createProductSchema>) {
  const supabase = createSupabaseServerClient();
  const { data: row, error } = await supabase.from("products").insert(data).select().single();
  if (error) return err({ message: error.message });
  return ok(row);
}

export async function patchProduct(data: z.infer<typeof updateProductSchema>) {
  const supabase = createSupabaseServerClient();
  const { id, ...patch } = data;
  const { data: row, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return err({ message: error.message });
  return ok(row);
}
