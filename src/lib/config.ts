import { z } from "zod";

export const company = {
  name: "Boutique Wines of the World",
  legalName: "Boutique Wines of the World Pty Ltd",
  shortName: "bwow",
};

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

let cachedClientEnv: z.infer<typeof clientEnvSchema> | null = null;

export function getClientConfig() {
  if (!cachedClientEnv) {
    cachedClientEnv = clientEnvSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
  }
  return cachedClientEnv;
}

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1),
  SITE_URL: z.url().default("http://localhost:3344"),
  AWS_REGION: z.string().optional(),
  SES_FROM_ADDRESS: z.string().email().optional(),
});

export function getServerConfig() {
  return serverEnvSchema.parse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SITE_URL: process.env.SITE_URL,
    AWS_REGION: process.env.AWS_REGION,
    SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS,
  });
}
