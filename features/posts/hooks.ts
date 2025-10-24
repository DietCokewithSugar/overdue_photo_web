'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createPost, deletePost, fetchPostById, fetchPosts, fetchUserPosts, likePost, unlikePost } from './api';
import type { CreatePostPayload, PostsFilter } from './api';

const POSTS_QUERY_KEY = ['posts'];
const USER_POSTS_QUERY_KEY = ['user-posts'];

export const usePostsQuery = (filter: PostsFilter) =>
  useInfiniteQuery({
    queryKey: [...POSTS_QUERY_KEY, filter],
    queryFn: ({ pageParam }) =>
      fetchPosts({ filter, cursor: pageParam as string | undefined, limit: 12 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });

export const usePostQuery = (postId: string) =>
  useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPostById(postId),
    enabled: Boolean(postId)
  });

export const useLikeMutation = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => likePost(postId),
    onSuccess: ({ likesCount }) => {
      queryClient.setQueryData(['post', postId], (prev: any) =>
        prev ? { ...prev, likesCount } : prev
      );
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_POSTS_QUERY_KEY });
    }
  });
};

export const useUnlikeMutation = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unlikePost(postId),
    onSuccess: ({ likesCount }) => {
      queryClient.setQueryData(['post', postId], (prev: any) =>
        prev ? { ...prev, likesCount } : prev
      );
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_POSTS_QUERY_KEY });
    }
  });
};

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostPayload) => createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_POSTS_QUERY_KEY });
    }
  });
};

export const useUserPosts = (enabled = true) =>
  useInfiniteQuery({
    queryKey: USER_POSTS_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchUserPosts({ cursor: pageParam as string | undefined, limit: 12 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled
  });

export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_POSTS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: ['post', postId] });
    }
  });
};
