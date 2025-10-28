import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase';

import { InternalServerError } from '@/server/errors';
import type { UpdateUserRoleInput } from './schema';

export const listUsers = async (options: {
  limit?: number;
  cursor?: string;
  role?: 'user' | 'admin';
}) => {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(options.limit ?? 30, 100);

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.role) {
    query = query.eq('role', options.role);
  }

  if (options.cursor) {
    query = query.lt('created_at', options.cursor);
  }

  const { data, error } = await query;

  if (error || !data) {
    throw new InternalServerError(error?.message ?? '加载用户失败');
  }

  const nextCursor = data.length === limit ? data.at(-1)?.created_at ?? null : null;

  return { items: data, nextCursor };
};

export const updateUserRole = async (userId: string, payload: UpdateUserRoleInput) => {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: payload.role })
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new InternalServerError(error.message);
  }

  return data;
};
