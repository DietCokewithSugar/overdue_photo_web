'use client';

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { deletePost, fetchAdminPosts, updatePostMeta } from './api';
import type { PaginatedPostsResponse } from '@/features/posts/types';

export const useAdminPosts = (status?: 'draft' | 'published' | 'archived') =>
  useInfiniteQuery<
    PaginatedPostsResponse,
    Error,
    InfiniteData<PaginatedPostsResponse, string | null>,
    ['admin-posts', 'draft' | 'published' | 'archived' | undefined],
    string | null
  >({
    queryKey: ['admin-posts', status],
    queryFn: ({ pageParam }) =>
      fetchAdminPosts({ status, cursor: pageParam ?? undefined, limit: 20 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null
  });

export const useUpdatePostMeta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      payload
    }: {
      postId: string;
      payload: Parameters<typeof updatePostMeta>[1];
    }) => updatePostMeta(postId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    }
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    }
  });
};
