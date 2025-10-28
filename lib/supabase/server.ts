import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { publicEnv, serverEnv } from '@/lib/env';
import type { Database } from '@/types/database';

export const createSupabaseRouteClient = () =>
  createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: async () => {
          const store = await cookies();
          return store.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll: async (cookieList) => {
          const store = await cookies();
          cookieList.forEach(({ name, value, options }) => {
            store.set({ name, value, ...options });
          });
        }
      }
    }
  );

let adminClient: SupabaseClient<Database> | null = null;

export const getSupabaseAdminClient = () => {
  if (!adminClient) {
    adminClient = createSupabaseClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return adminClient;
};
