import { apiFetch } from '@/lib/api';

import type { ContestDto, ContestListResponse } from '@/features/contests/types';

export interface FetchAdminContestsParams {
  status?: 'draft' | 'published' | 'closed';
  cursor?: string | null;
  limit?: number;
}

export const fetchAdminContests = async (params: FetchAdminContestsParams = {}) => {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));

  return apiFetch<ContestListResponse>(`/api/contests?${search.toString()}`);
};

export const createContest = async (payload: {
  title: string;
  slug: string;
  description?: string;
  posterPath?: string;
  submissionStartsAt: string;
  submissionEndsAt: string;
  singleSubmissionLimit: number;
  collectionSubmissionLimit: number;
  singleFileSizeLimitMb: number;
  status: 'draft' | 'published' | 'closed';
}) =>
  apiFetch<ContestDto>(`/api/contests`, {
    method: 'POST',
    json: payload
  });

export const updateContest = async (contestId: string, payload: Partial<typeof createContest extends (...args: any) => any ? Parameters<typeof createContest>[0] : never>) =>
  apiFetch<ContestDto>(`/api/contests/${contestId}`, {
    method: 'PATCH',
    json: payload
  });
