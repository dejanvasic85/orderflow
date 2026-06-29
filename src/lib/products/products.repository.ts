import { err, ok, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  CreateProductInput,
  ListProductsFilters,
  ProductRow,
  UpdateProductInput,
} from "./schema";

const productSelect = "id, name, image_url, qty_per_box, active, created_at, updated_at" as const;

export type ProductRepository = {
  findActiveProducts(): Promise<Result<ProductRow[]>>;
  findPagedProducts(
    filters: ListProductsFilters,
  ): Promise<Result<{ products: ProductRow[]; total: number }>>;
  findProductById(id: string): Promise<Result<ProductRow>>;
  createProduct(data: CreateProductInput): Promise<Result<ProductRow>>;
  updateProduct(data: UpdateProductInput): Promise<Result<ProductRow>>;
};

export function createProductRepository(): ProductRepository {
  return {
    async findActiveProducts() {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("products")
        .select(productSelect)
        .eq("active", true)
        .order("name", { ascending: true });
      if (error) return err({ message: error.message });
      return ok(data ?? []);
    },

    async findPagedProducts(filters) {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from("products")
        .select(productSelect, { count: "exact" })
        .order("name", { ascending: true });

      if (!filters.includeInactive) query = query.eq("active", true);

      if (filters.q) {
        const safe = filters.q.replace(/[,%_()]/g, "").trim();
        if (safe.length > 0) {
          query = query.ilike("name", `%${safe}%`);
        }
      }

      const page = filters.page ?? 1;
      const from = (page - 1) * 12;
      query = query.range(from, from + 12 - 1);

      const { data, error, count } = await query;
      if (error) return err({ message: error.message });
      return ok({ products: data ?? [], total: count ?? 0 });
    },

    async findProductById(id) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("products")
        .select(productSelect)
        .eq("id", id)
        .single();
      if (error) return err({ message: error.message });
      return ok(data);
    },

    async createProduct(data) {
      const supabase = createSupabaseServerClient();
      const { data: row, error } = await supabase.from("products").insert(data).select().single();
      if (error) return err({ message: error.message });
      return ok(row);
    },

    async updateProduct(data) {
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
    },
  };
}
