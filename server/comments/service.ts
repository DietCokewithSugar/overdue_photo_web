import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase';
import { resolveUserRole } from '@/server/auth';
import type { Database } from '@/types/database';

import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError
} from '@/server/errors';
import {
  createCommentInputSchema,
  updateCommentInputSchema,
  type CreateCommentInput,
  type UpdateCommentInput
} from './schema';

type CommentRow = Database['public']['Tables']['post_comments']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type CommentRecord = CommentRow & { profiles?: Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url'> | null };

export type CommentWithAuthor = CommentRow & {
  author: Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url'> | null;
};

const mapComment = (row: CommentRecord): CommentWithAuthor => ({
  ...row,
  author: row.profiles ? { ...row.profiles } : null
});

export interface ListCommentsOptions {
  limit?: number;
  cursor?: string;
}

export const listComments = async (
  postId: string,
  options: ListCommentsOptions = {}
): Promise<{ items: CommentWithAuthor[]; nextCursor: string | null }> => {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(options.limit ?? 20, 50);

  let query = supabase
    .from('post_comments')
    .select('*, profiles!post_comments_author_id_fkey(id, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (options.cursor) {
    query = query.gt('created_at', options.cursor);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error || !data) {
    throw new InternalServerError(error?.message ?? '加载评论失败');
  }

  const items = (data as CommentRecord[])
    .filter((comment) => comment.status === 'active')
    .map(mapComment);

  const nextCursor = items.length === limit ? items.at(-1)?.created_at ?? null : null;

  return { items, nextCursor }; 
};

export const createComment = async (
  userId: string,
  payload: CreateCommentInput
): Promise<CommentWithAuthor> => {
  const input = createCommentInputSchema.parse(payload);
  const supabase = getSupabaseAdminClient();

  if (input.parentCommentId) {
    const parentExists = await supabase
      .from('post_comments')
      .select('id')
      .eq('id', input.parentCommentId)
      .maybeSingle();

    if (parentExists.error) {
      throw new InternalServerError(parentExists.error.message);
    }

    if (!parentExists.data) {
      throw new NotFoundError('回复的评论不存在');
    }
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: input.postId,
      author_id: userId,
      body: input.body,
      parent_comment_id: input.parentCommentId ?? null
    })
    .select('*, profiles!post_comments_author_id_fkey(id, display_name, avatar_url)')
    .single();

  if (error || !data) {
    throw new UnprocessableEntityError(error?.message ?? '发表评论失败');
  }

  return mapComment(data as CommentRecord);
};

export const updateComment = async (
  commentId: string,
  actorId: string,
  payload: UpdateCommentInput
): Promise<CommentWithAuthor> => {
  const supabase = getSupabaseAdminClient();
  const input = updateCommentInputSchema.parse(payload);

  const existing = await supabase
    .from('post_comments')
    .select('*')
    .eq('id', commentId)
    .maybeSingle();

  if (existing.error) {
    throw new InternalServerError(existing.error.message);
  }

  if (!existing.data) {
    throw new NotFoundError('评论不存在');
  }

  const role = await resolveUserRole(actorId);
  const isOwner = existing.data.author_id === actorId;
  const isAdmin = role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('无权编辑该评论');
  }

  const { data, error } = await supabase
    .from('post_comments')
    .update({
      body: input.body ?? existing.data.body,
      status: input.status ?? existing.data.status
    })
    .eq('id', commentId)
    .select('*, profiles!post_comments_author_id_fkey(id, display_name, avatar_url)')
    .single();

  if (error || !data) {
    throw new UnprocessableEntityError(error?.message ?? '更新评论失败');
  }

  return mapComment(data as CommentRecord);
};

export const deleteComment = async (commentId: string, actorId: string): Promise<void> => {
  const supabase = getSupabaseAdminClient();
  const existing = await supabase
    .from('post_comments')
    .select('id, author_id')
    .eq('id', commentId)
    .maybeSingle();

  if (existing.error) {
    throw new InternalServerError(existing.error.message);
  }

  if (!existing.data) {
    throw new NotFoundError('评论不存在');
  }

  const role = await resolveUserRole(actorId);
  const isOwner = existing.data.author_id === actorId;
  const isAdmin = role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('无权删除该评论');
  }

  const { error } = await supabase
    .from('post_comments')
    .update({ status: 'deleted' })
    .eq('id', commentId);

  if (error) {
    throw new InternalServerError(error.message);
  }
};
