import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import { failure, success } from '@/server/http';
import { listPosts } from '@/server/posts/service';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') ?? undefined;
    const limitParam = searchParams.get('limit');
    const statusParam = searchParams.get('status');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : undefined;
    const status =
      statusParam === 'draft' || statusParam === 'published' || statusParam === 'archived'
        ? statusParam
        : undefined;

    const posts = await listPosts({
      authorId: session.user.id,
      cursor,
      limit,
      status
    });

    const last = posts.at(-1);
    const nextCursor =
      posts.length > 0 ? last?.published_at ?? last?.created_at ?? null : null;

    return success({ items: posts, nextCursor });
  } catch (error) {
    return failure(error);
  }
}
