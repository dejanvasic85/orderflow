import type { z } from "zod";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { assertAdminOrStaff } from "@/lib/users/users.server";
import { type ListProductsFilters, productPageSize } from "./schema";
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

export async function fetchPagedProducts(filters: ListProductsFilters = {}) {
  const supabase = createSupabaseServerClient();
  if (filters.includeInactive) await assertAdminOrStaff(supabase);

  let query = supabase
    .from("products")
    .select(productSelect, { count: "exact" })
    .order("name", { ascending: true });

  if (!filters.includeInactive) query = query.eq("active", true);

  if (filters.q) {
    const safe = filters.q.replace(/[%_()]/g, "");
    query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const page = filters.page ?? 1;
  const from = (page - 1) * productPageSize;
  query = query.range(from, from + productPageSize - 1);

  const { data, error, count } = await query;
  if (error) return err({ message: error.message });
  return ok({ products: data ?? [], total: count ?? 0 });
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
