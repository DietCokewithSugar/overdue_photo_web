import { apiFetch } from '@/lib/api';

export interface AdminCommentDto {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  status: 'active' | 'deleted' | 'hidden';
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  posts?: {
    title: string | null;
  } | null;
}

export interface AdminCommentsResponse {
  items: AdminCommentDto[];
  nextCursor: string | null;
}

export const fetchAdminComments = async (params: { cursor?: string | null; limit?: number }) => {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));

  return apiFetch<AdminCommentsResponse>(`/api/admin/comments?${search.toString()}`);
};
