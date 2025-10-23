import 'server-only';

import { serverEnv } from '@/lib/env';

export const STORAGE_BUCKETS = {
  posts: serverEnv.SUPABASE_STORAGE_BUCKET_POSTS,
  contestPosters: serverEnv.SUPABASE_STORAGE_BUCKET_CONTEST_POSTERS,
  contestEntries: serverEnv.SUPABASE_STORAGE_BUCKET_CONTEST_ENTRIES
} as const;

export type StorageBucketKey = keyof typeof STORAGE_BUCKETS;

export const resolveBucket = (key: StorageBucketKey) => STORAGE_BUCKETS[key];
