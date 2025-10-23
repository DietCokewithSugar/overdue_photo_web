import 'server-only';

import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET_POSTS: z.string().min(1),
  SUPABASE_STORAGE_BUCKET_CONTEST_POSTERS: z.string().min(1),
  SUPABASE_STORAGE_BUCKET_CONTEST_ENTRIES: z.string().min(1)
});

const parseOrThrow = <T extends z.ZodTypeAny>(
  schema: T,
  source: Record<string, unknown>,
  kind: 'public' | 'server'
): z.infer<T> => {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const message = parsed.error.flatten().formErrors.join('\n') || 'invalid values';
    throw new Error(`${kind} environment validation failed: ${message}`);
  }
  return parsed.data;
};

export const publicEnv = parseOrThrow(publicEnvSchema, process.env, 'public');
export const serverEnv = parseOrThrow(serverEnvSchema, process.env, 'server');

export const env = {
  ...publicEnv,
  ...serverEnv
};

export type PublicEnv = typeof publicEnv;
export type ServerEnv = typeof serverEnv;
