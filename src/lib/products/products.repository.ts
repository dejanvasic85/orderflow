import { err, ok, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  CreateProductInput,
  ListProductsFilters,
  Product,
  ProductRow,
  UpdateProductInput,
} from "./schema";

const productSelect =
  "id, name, image_url, qty_per_box, active, external_id, created_at, updated_at" as const;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    qtyPerBox: row.qty_per_box,
    active: row.active,
    externalId: row.external_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProductInsert(input: CreateProductInput) {
  return {
    name: input.name,
    image_url: input.imageUrl ?? null,
    qty_per_box: input.qtyPerBox,
    ...(input.active !== undefined && { active: input.active }),
  };
}

function toProductUpdate(input: Omit<UpdateProductInput, "id">) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.imageUrl !== undefined && { image_url: input.imageUrl }),
    ...(input.qtyPerBox !== undefined && { qty_per_box: input.qtyPerBox }),
    ...(input.active !== undefined && { active: input.active }),
  };
}

export type ProductRepository = {
  findActiveProducts(): Promise<Result<Product[]>>;
  findPagedProducts(
    filters: ListProductsFilters,
  ): Promise<Result<{ products: Product[]; total: number }>>;
  findProductById(id: string): Promise<Result<Product>>;
  createProduct(data: CreateProductInput): Promise<Result<Product>>;
  updateProduct(data: UpdateProductInput): Promise<Result<Product>>;
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
      return ok((data ?? []).map(toProduct));
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
      return ok({ products: (data ?? []).map(toProduct), total: count ?? 0 });
    },

    async findProductById(id) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("products")
        .select(productSelect)
        .eq("id", id)
        .single();
      if (error) return err({ message: error.message });
      return ok(toProduct(data));
    },

    async createProduct(data) {
      const supabase = createSupabaseServerClient();
      const { data: row, error } = await supabase
        .from("products")
        .insert(toProductInsert(data))
        .select(productSelect)
        .single();
      if (error) return err({ message: error.message });
      return ok(toProduct(row));
    },

    async updateProduct(data) {
      const supabase = createSupabaseServerClient();
      const { id, ...rest } = data;
      const { data: row, error } = await supabase
        .from("products")
        .update(toProductUpdate(rest))
        .eq("id", id)
        .select(productSelect)
        .single();
      if (error) return err({ message: error.message });
      return ok(toProduct(row));
    },
  };
}
