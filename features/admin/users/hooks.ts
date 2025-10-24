'use client';

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { fetchAdminUsers, updateUserRole, type AdminUsersResponse } from './api';

export const useAdminUsers = (role?: 'user' | 'admin') =>
  useInfiniteQuery<
    AdminUsersResponse,
    Error,
    InfiniteData<AdminUsersResponse, string | null>,
    ['admin-users', 'user' | 'admin' | undefined],
    string | null
  >({
    queryKey: ['admin-users', role],
    queryFn: ({ pageParam }) =>
      fetchAdminUsers({ cursor: pageParam ?? undefined, limit: 20, role }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null
  });

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'user' | 'admin' }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });
};
