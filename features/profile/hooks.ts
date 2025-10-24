'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { PROFILE_QUERY_KEY } from '@/features/auth/hooks';

export interface ProfileDto {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin';
}

export const useProfile = () =>
  useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      try {
        const profile = await apiFetch<ProfileDto>('/api/profile/me');
        return profile;
      } catch (error) {
        return null;
      }
    },
    staleTime: 1000 * 60,
    retry: false
  });

type UpdateProfilePayload = {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const body: Record<string, unknown> = {};
      if (payload.displayName !== undefined) body.displayName = payload.displayName;
      if (payload.avatarUrl !== undefined) body.avatarUrl = payload.avatarUrl;
      if (payload.bio !== undefined) body.bio = payload.bio;

      const profile = await apiFetch<ProfileDto>('/api/profile/me', {
        method: 'PATCH',
        json: body
      });

      return profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
    }
  });
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      apiFetch<{ message: string }>('/api/profile/change-password', {
        method: 'POST',
        json: {
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword
        }
      })
  });
