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
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SES_FROM_ADDRESS: z.email().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
});

export function getServerConfig() {
  return serverEnvSchema.parse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SITE_URL: process.env.SITE_URL,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  });
}
