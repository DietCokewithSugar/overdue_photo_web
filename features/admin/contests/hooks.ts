'use client';

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { createContest, fetchAdminContests, updateContest } from './api';
import type { ContestListResponse } from '@/features/contests/types';

export const useAdminContests = (status?: 'draft' | 'published' | 'closed') =>
  useInfiniteQuery<
    ContestListResponse,
    Error,
    InfiniteData<ContestListResponse, string | null>,
    ['admin-contests', 'draft' | 'published' | 'closed' | undefined],
    string | null
  >({
    queryKey: ['admin-contests', status],
    queryFn: ({ pageParam }) =>
      fetchAdminContests({ status, cursor: pageParam ?? undefined, limit: 20 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null
  });

export const useCreateContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contests'] });
    }
  });
};

export const useUpdateContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contestId, payload }: { contestId: string; payload: Parameters<typeof updateContest>[1]; }) =>
      updateContest(contestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contests'] });
    }
  });
};
