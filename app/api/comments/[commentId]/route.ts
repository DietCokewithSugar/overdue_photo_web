import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import { deleteComment, updateComment } from '@/server/comments/service';
import { updateCommentInputSchema } from '@/server/comments/schema';
import { failure, noContent, success } from '@/server/http';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const input = updateCommentInputSchema.parse(body);
    const { commentId } = await context.params;
    const comment = await updateComment(commentId, session.user.id, input);
    return success(comment);
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await requireSession();
    const { commentId } = await context.params;
    await deleteComment(commentId, session.user.id);
    return noContent();
  } catch (error) {
    return failure(error);
  }
}
