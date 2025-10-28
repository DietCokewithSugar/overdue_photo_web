import { NextRequest } from 'next/server';

import { getSupabaseAdminClient } from '@/lib/supabase';
import { requireAdmin } from '@/server/auth';
import { failure, success } from '@/server/http';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 30;

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from('post_comments')
      .select('*, profiles!post_comments_author_id_fkey(display_name, avatar_url), posts(title)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error || !data) {
      throw error ?? new Error('加载评论失败');
    }

    const nextCursor = data.length === limit ? data.at(-1)?.created_at ?? null : null;

    return success({ items: data, nextCursor });
  } catch (error) {
    return failure(error);
  }
}
