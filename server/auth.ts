import 'server-only';

import type { Session } from '@supabase/supabase-js';

import { createSupabaseRouteClient, getSupabaseAdminClient } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';

import { ForbiddenError, UnauthorizedError } from './errors';

export const getSession = async (): Promise<Session | null> => {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new UnauthorizedError(error.message);
  }

  return data.session;
};

export const requireSession = async (): Promise<Session> => {
  const session = await getSession();

  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
};

export const resolveUserRole = async (userId: string): Promise<UserRole> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new ForbiddenError(error.message);
  }

  return (data?.role as UserRole | null) ?? 'user';
};

export const requireRole = async (roles: UserRole | UserRole[]) => {
  const session = await requireSession();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const role = await resolveUserRole(session.user.id);

  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError();
  }

  return { session, role };
};

export const requireAdmin = async () => requireRole('admin');
