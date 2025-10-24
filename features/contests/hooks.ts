'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData
} from '@tanstack/react-query';

import { fetchContestById, fetchContestEntries, fetchContests, submitContestEntry } from './api';
import type { ContestEntriesResponse, ContestListResponse } from './types';

export const useContestsQuery = () =>
  useInfiniteQuery<ContestListResponse, Error, InfiniteData<ContestListResponse, string | null>, ['contests'], string | null>({
    queryKey: ['contests'],
    queryFn: ({ pageParam }) =>
      fetchContests({ status: 'published', cursor: pageParam ?? undefined, limit: 10 }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null
  });

export const useContestQuery = (contestId: string) =>
  useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => fetchContestById(contestId),
    enabled: Boolean(contestId)
  });

export const useContestEntriesQuery = (contestId: string) =>
  useInfiniteQuery<
    ContestEntriesResponse,
    Error,
    InfiniteData<ContestEntriesResponse, string | null>,
    ['contestEntries', string],
    string | null
  >({
    queryKey: ['contestEntries', contestId],
    queryFn: ({ pageParam }) =>
      fetchContestEntries(contestId, {
        status: 'approved',
        cursor: pageParam ?? undefined,
        limit: 12
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled: Boolean(contestId)
  });

export const useSubmitContestEntry = (contestId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: Parameters<typeof submitContestEntry>[1]
    ) => submitContestEntry(contestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
      queryClient.invalidateQueries({ queryKey: ['contestEntries', contestId] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    }
  });
};
