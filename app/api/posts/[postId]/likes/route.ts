import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import { failure, success } from '@/server/http';
import { likePost, unlikePost } from '@/server/posts/service';

export async function POST(
  _: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await requireSession();
    const { postId } = await context.params;
    const likesCount = await likePost(postId, session.user.id);
    return success({ likesCount });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await requireSession();
    const { postId } = await context.params;
    const likesCount = await unlikePost(postId, session.user.id);
    return success({ likesCount });
  } catch (error) {
    return failure(error);
  }
}
