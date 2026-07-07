import { z } from "zod";

const jwtClaimsSchema = z.object({ user_role: z.string().optional() });

export function parseJwtClaims(decodedPayload: string): { user_role?: string } {
  try {
    const result = jwtClaimsSchema.safeParse(JSON.parse(decodedPayload));
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}
