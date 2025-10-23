'use client';

import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { PROFILE_QUERY_KEY } from '@/features/auth/hooks';

interface ProfileDto {
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
