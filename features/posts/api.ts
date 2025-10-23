import { apiFetch } from '@/lib/api';

import type { PaginatedPostsResponse, PostDto } from './types';
import type { JsonValue } from '@/types/json';

export type PostsFilter = 'latest' | 'featured';

export interface FetchPostsParams {
  cursor?: string | null;
  filter?: PostsFilter;
  authorId?: string;
  limit?: number;
}

export const fetchPosts = async (params: FetchPostsParams): Promise<PaginatedPostsResponse> => {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.filter) search.set('filter', params.filter);
  if (params.authorId) search.set('authorId', params.authorId);
  if (params.limit) search.set('limit', String(params.limit));

  return apiFetch<PaginatedPostsResponse>(`/api/posts?${search.toString()}`);
};

export const fetchPostById = async (postId: string) =>
  apiFetch<PostDto>(`/api/posts/${postId}`);

export const likePost = async (postId: string) =>
  apiFetch<{ likesCount: number }>(`/api/posts/${postId}/likes`, {
    method: 'POST'
  });

export const unlikePost = async (postId: string) =>
  apiFetch<{ likesCount: number }>(`/api/posts/${postId}/likes`, {
    method: 'DELETE'
  });

export interface CreatePostPayload {
  title: string;
  contentPlaintext?: string;
  contentRichtext?: JsonValue;
  images: Array<{
    storagePath: string;
    thumbnailPath?: string;
    width?: number;
    height?: number;
    blurhash?: string;
  }>;
  status?: 'draft' | 'published';
  publishedAt?: string;
}

export const createPost = async (payload: CreatePostPayload) => {
  const images = payload.images.map((image) => {
    const result: Record<string, JsonValue> = {
      storagePath: image.storagePath
    };

    if (image.thumbnailPath) result.thumbnailPath = image.thumbnailPath;
    if (typeof image.width === 'number') result.width = image.width;
    if (typeof image.height === 'number') result.height = image.height;
    if (image.blurhash) result.blurhash = image.blurhash;

    return result;
  });

  const body: Record<string, JsonValue> = {
    title: payload.title,
    images
  };

  if (payload.contentPlaintext) {
    body.contentPlaintext = payload.contentPlaintext;
  }

  if (payload.contentRichtext) {
    body.contentRichtext = payload.contentRichtext;
  }

  if (payload.status) {
    body.status = payload.status;
  }

  if (payload.publishedAt) {
    body.publishedAt = payload.publishedAt;
  }

  return apiFetch<PostDto>('/api/posts', {
    method: 'POST',
    json: body
  });
};
