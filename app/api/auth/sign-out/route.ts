import { NextRequest } from 'next/server';

import { createSupabaseRouteClient } from '@/lib/supabase';
import { failure, noContent } from '@/server/http';

export async function POST(_: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return noContent();
  } catch (error) {
    return failure(error);
  }
}
