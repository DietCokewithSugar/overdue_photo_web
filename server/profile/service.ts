import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase';

import { InternalServerError, NotFoundError } from '@/server/errors';
import type { UpdateProfileInput } from './schema';

export const getProfileById = async (userId: string) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new InternalServerError(error.message);
  }

  if (!data) {
    throw new NotFoundError('用户资料不存在');
  }

  return data;
};

export const updateProfile = async (userId: string, payload: UpdateProfileInput) => {
  const supabase = getSupabaseAdminClient();

  const { error, data } = await supabase
    .from('profiles')
    .update({
      display_name: payload.displayName,
      avatar_url: payload.avatarUrl,
      bio: payload.bio
    })
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new InternalServerError(error.message);
  }

  if (!data) {
    throw new NotFoundError('用户资料不存在');
  }

  return data;
};
