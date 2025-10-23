'use client';

import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';

export interface OverviewStats {
  posts: number;
  contests: number;
  pendingEntries: number;
  comments: number;
}

export const useAdminOverview = () =>
  useQuery({
    queryKey: ['admin-overview'],
    queryFn: () =>
      apiFetch<OverviewStats>('/api/admin/overview').catch(() => ({
        posts: 0,
        contests: 0,
        pendingEntries: 0,
        comments: 0
      }))
  });
