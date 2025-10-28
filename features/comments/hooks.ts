'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';

import { createComment, deleteComment, fetchComments, updateComment } from './api';

export const useCommentsQuery = (postId: string) =>
  useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) =>
      fetchComments({ postId, cursor: pageParam as string | undefined, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(postId)
  });

export const useCommentsPreview = (postId: string, limit = 5) =>
  useQuery({
    queryKey: ['comments-preview', postId, limit],
    queryFn: () => fetchComments({ postId, limit }),
    enabled: Boolean(postId),
    staleTime: 1000 * 15
  });

export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, parentCommentId }: { body: string; parentCommentId?: string }) =>
      createComment(postId, body, parentCommentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments-preview', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });
};

export const useUpdateComment = (postId: string, commentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => updateComment(commentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments-preview', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });
};

export const useDeleteComment = (postId: string, commentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments-preview', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });
};
