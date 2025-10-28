'use client';

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { deleteComment, updateComment } from '@/features/comments/api';

import { fetchAdminComments } from './api';
import type { AdminCommentsResponse } from './api';

export const useAdminComments = () =>
  useInfiniteQuery<
    AdminCommentsResponse,
    Error,
    InfiniteData<AdminCommentsResponse, string | null>,
    ['admin-comments'],
    string | null
  >({
    queryKey: ['admin-comments'],
    queryFn: ({ pageParam }) =>
      fetchAdminComments({ cursor: pageParam ?? undefined, limit: 30 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null
  });

export const useUpdateCommentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => updateComment(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['comments', variables.id] });
    }
  });
};

export const useDeleteCommentAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    }
  });
};
