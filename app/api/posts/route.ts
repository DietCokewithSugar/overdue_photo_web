import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import { failure, success, created } from '@/server/http';
import { createPost, listPosts } from '@/server/posts/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const filterParam = searchParams.get('filter');
    const authorId = searchParams.get('authorId') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const statusParam = searchParams.get('status');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : undefined;
    const filter =
      filterParam === 'latest' || filterParam === 'featured' ? filterParam : undefined;
    const status =
      statusParam === 'draft' || statusParam === 'published' || statusParam === 'archived'
        ? statusParam
        : undefined;

    const posts = await listPosts({ limit, filter, authorId, cursor, status });
    const lastPost = posts.at(-1);
    const nextCursor =
      posts.length > 0 ? lastPost?.published_at ?? lastPost?.created_at ?? null : null;

    return success({ items: posts, nextCursor });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const session = await requireSession();
    const post = await createPost(session.user.id, payload);
    return created(post);
  } catch (error) {
    return failure(error);
  }
}
