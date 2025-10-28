import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import { failure, noContent, success } from '@/server/http';
import { deletePost, getPostById, updatePost } from '@/server/posts/service';

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const post = await getPostById(postId);
    return success(post);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const payload = await request.json();
    const session = await requireSession();
    const { postId } = await context.params;
    const post = await updatePost(postId, session.user.id, payload);
    return success(post);
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
    await deletePost(postId, session.user.id);
    return noContent();
  } catch (error) {
    return failure(error);
  }
}
