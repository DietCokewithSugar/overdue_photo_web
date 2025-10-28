import { apiFetch } from '@/lib/api';

import type { UserRole } from '@/types/auth';

export interface AdminUserDto {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
}

export interface AdminUsersResponse {
  items: AdminUserDto[];
  nextCursor: string | null;
}

export const fetchAdminUsers = async (params: {
  cursor?: string | null;
  limit?: number;
  role?: UserRole;
}) => {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.role) search.set('role', params.role);

  return apiFetch<AdminUsersResponse>(`/api/admin/users?${search.toString()}`);
};

export const updateUserRole = async (userId: string, role: UserRole) =>
  apiFetch<AdminUserDto>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    json: { role }
  });
