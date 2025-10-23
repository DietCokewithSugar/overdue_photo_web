import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/auth';
import { failure, success } from '@/server/http';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(_: NextRequest) {
  try {
    await requireAdmin();

    const supabase = getSupabaseAdminClient();

    const [posts, contests, pendingEntries, comments] = await Promise.all([
      supabase.from('posts').select('*', { head: true, count: 'exact' }),
      supabase.from('contests').select('*', { head: true, count: 'exact' }),
      supabase
        .from('contest_entries')
        .select('*', { head: true, count: 'exact' })
        .eq('status', 'pending'),
      supabase.from('post_comments').select('*', { head: true, count: 'exact' })
    ]);

    return success({
      posts: posts.count ?? 0,
      contests: contests.count ?? 0,
      pendingEntries: pendingEntries.count ?? 0,
      comments: comments.count ?? 0
    });
  } catch (error) {
    return failure(error);
  }
}
