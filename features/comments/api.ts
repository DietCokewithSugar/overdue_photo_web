import { apiFetch } from '@/lib/api';

import type { PaginatedCommentsResponse, CommentDto } from './types';

export interface FetchCommentsParams {
  postId: string;
  cursor?: string | null;
  limit?: number;
}

export const fetchComments = async ({ postId, cursor, limit }: FetchCommentsParams) => {
  const search = new URLSearchParams();
  if (cursor) search.set('cursor', cursor);
  if (limit) search.set('limit', String(limit));

  return apiFetch<PaginatedCommentsResponse>(
    `/api/posts/${postId}/comments?${search.toString()}`
  );
};

export const createComment = async (postId: string, body: string, parentCommentId?: string) =>
  apiFetch<CommentDto>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    json: parentCommentId ? { body, parentCommentId } : { body }
  });

export const updateComment = async (commentId: string, body: string) =>
  apiFetch<CommentDto>(`/api/comments/${commentId}`, {
    method: 'PATCH',
    json: { body }
  });

export const deleteComment = async (commentId: string) =>
  apiFetch<void>(`/api/comments/${commentId}`, {
    method: 'DELETE'
  });
