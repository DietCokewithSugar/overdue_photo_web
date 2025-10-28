import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import { createComment, listComments } from '@/server/comments/service';
import {
  createCommentInputSchema,
  listCommentsQuerySchema
} from '@/server/comments/schema';
import { created, failure, success } from '@/server/http';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listCommentsQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined
    });

    const { postId } = await context.params;
    const result = await listComments(postId, query);
    return success(result);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { postId } = await context.params;
    const input = createCommentInputSchema.parse({ ...body, postId });
    const comment = await createComment(session.user.id, input);
    return created(comment);
  } catch (error) {
    return failure(error);
  }
}
