'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData
} from '@tanstack/react-query';

import {
  deleteContestEntry,
  fetchContestById,
  fetchContestEntries,
  fetchContests,
  fetchUserContestEntries,
  submitContestEntry
} from './api';
import type {
  ContestEntriesResponse,
  ContestListResponse,
  UserContestEntriesResponse
} from './types';

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

export const useContestEntriesQuery = (
  contestId: string,
  options: {
    status?: 'pending' | 'approved' | 'rejected';
    mine?: boolean;
    limit?: number;
    enabled?: boolean;
  } = {}
) =>
  useInfiniteQuery<
    ContestEntriesResponse,
    Error,
    InfiniteData<ContestEntriesResponse, string | null>,
    ['contestEntries', string, string, boolean],
    string | null
  >({
    queryKey: [
      'contestEntries',
      contestId,
      options.status ?? (options.mine ? 'all' : 'approved'),
      Boolean(options.mine)
    ],
    queryFn: ({ pageParam }) =>
      fetchContestEntries(contestId, {
        status: options.status ?? (options.mine ? undefined : 'approved'),
        cursor: pageParam ?? undefined,
        limit: options.limit ?? 12,
        mine: options.mine
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled: Boolean(contestId) && (options.enabled ?? true)
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

export const useUserContestEntries = (enabled = true) =>
  useInfiniteQuery<UserContestEntriesResponse, Error, InfiniteData<UserContestEntriesResponse, string | null>, ['myContestEntries'], string | null>({
    queryKey: ['myContestEntries'],
    queryFn: ({ pageParam }) =>
      fetchUserContestEntries({ cursor: pageParam ?? undefined, limit: 12 }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled
  });

export const useDeleteContestEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteContestEntry(entryId),
    onSuccess: (_, entryId) => {
      queryClient.invalidateQueries({ queryKey: ['myContestEntries'] });
      queryClient.removeQueries({ queryKey: ['contestEntry', entryId] });
      queryClient.invalidateQueries({ queryKey: ['contestEntries'] });
    }
  });
};
