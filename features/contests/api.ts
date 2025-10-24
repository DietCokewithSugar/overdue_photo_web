import { apiFetch } from '@/lib/api';

import type {
  ContestDto,
  ContestEntryDto,
  ContestEntriesResponse,
  ContestListResponse,
  UserContestEntriesResponse
} from './types';

export const fetchContests = async (params: {
  status?: 'draft' | 'published' | 'closed';
  cursor?: string | null;
  limit?: number;
}) => {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));

  return apiFetch<ContestListResponse>(`/api/contests?${search.toString()}`);
};

export const fetchContestById = async (contestId: string) =>
  apiFetch<ContestDto>(`/api/contests/${contestId}`);

export const fetchContestEntries = async (contestId: string, params: {
  status?: 'pending' | 'approved' | 'rejected';
  cursor?: string | null;
  limit?: number;
  mine?: boolean;
}) => {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.mine) search.set('mine', 'true');

  return apiFetch<ContestEntriesResponse>(
    `/api/contests/${contestId}/entries?${search.toString()}`
  );
};

export const submitContestEntry = async (
  contestId: string,
  payload: {
    entryType: 'single' | 'collection';
    title: string;
    description?: string;
    images: Array<{
      storagePath: string;
      thumbnailPath?: string;
      sortOrder?: number;
    }>;
  }
) =>
  apiFetch<ContestEntryDto>(`/api/contests/${contestId}/entries`, {
    method: 'POST',
    json: payload
  });

export const fetchUserContestEntries = async (params: { cursor?: string | null; limit?: number }) => {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));

  return apiFetch<UserContestEntriesResponse>(`/api/profile/me/contest-entries?${search.toString()}`);
};

export const deleteContestEntry = async (entryId: string) =>
  apiFetch<void>(`/api/contest-entries/${entryId}`, {
    method: 'DELETE'
  });
