import { z } from "zod";

export const company = {
  name: "Boutique Wines of the World",
  legalName: "Boutique Wines of the World Pty Ltd",
  shortName: "bwow",
};

const configSchema = z.object({
  supabaseUrl: z.url("VITE_SUPABASE_URL must be a valid URL"),
  supabaseAnonKey: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  supabaseSecretKey: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
});

export type Config = z.infer<typeof configSchema>;

export function getConfig(): Config {
  return configSchema.parse({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseSecretKey: process.env["SUPABASE_SECRET_KEY"],
  });
}
