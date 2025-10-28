import { apiFetch } from '@/lib/api';
import type { PaginatedPostsResponse, PostDto } from '@/features/posts/types';

export interface FetchAdminPostsParams {
  status?: 'draft' | 'published' | 'archived';
  cursor?: string | null;
  limit?: number;
}

export const fetchAdminPosts = async (params: FetchAdminPostsParams) => {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));

  return apiFetch<PaginatedPostsResponse>(`/api/posts?${search.toString()}`);
};

export const updatePostMeta = async (
  postId: string,
  payload: Partial<Pick<PostDto, 'status' | 'is_featured' | 'title'>>
) =>
  apiFetch<PostDto>(`/api/posts/${postId}`, {
    method: 'PATCH',
    json: payload
  });

export const deletePost = async (postId: string) =>
  apiFetch<void>(`/api/posts/${postId}`, {
    method: 'DELETE'
  });
