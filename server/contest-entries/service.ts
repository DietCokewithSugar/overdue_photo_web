import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase';
import { resolveUserRole } from '@/server/auth';
import type { Database } from '@/types/database';

import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError
} from '@/server/errors';
import {
  createContestEntryInputSchema,
  updateContestEntryInputSchema,
  updateContestEntryStatusSchema,
  type CreateContestEntryInput,
  type UpdateContestEntryInput
} from './schema';

type ContestRow = Database['public']['Tables']['contests']['Row'];
type EntryRow = Database['public']['Tables']['contest_entries']['Row'];
type EntryImageRow = Database['public']['Tables']['contest_entry_images']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type EntryRecord = EntryRow & {
  profiles?: Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url'> | null;
  contest_entry_images?: EntryImageRow[] | null;
};

export type ContestEntryWithImages = EntryRow & {
  images: EntryImageRow[];
  author: Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url'> | null;
};

const mapEntry = (entry: EntryRecord): ContestEntryWithImages => ({
  ...entry,
  images: entry.contest_entry_images ?? [],
  author: entry.profiles ?? null
});

const ensureContestEditable = (contest: ContestRow, now = new Date()) => {
  const start = new Date(contest.submission_starts_at);
  const end = new Date(contest.submission_ends_at);

  if (now < start || now > end) {
    throw new ForbiddenError('当前不在比赛投稿时间范围内');
  }
};

const assertContestExists = async (contestId: string): Promise<ContestRow> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('contests').select('*').eq('id', contestId).maybeSingle();

  if (error) {
    throw new InternalServerError(error.message);
  }

  if (!data) {
    throw new NotFoundError('比赛不存在');
  }

  return data;
};

const getEntryById = async (entryId: string): Promise<ContestEntryWithImages> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('contest_entries')
    .select(
      '* , contest_entry_images(*), profiles!contest_entries_author_id_fkey(id, display_name, avatar_url)'
    )
    .eq('id', entryId)
    .maybeSingle();

  if (error) {
    throw new InternalServerError(error.message);
  }

  if (!data) {
    throw new NotFoundError('投稿不存在');
  }

  return mapEntry(data as EntryRecord);
};

const checkSubmissionLimit = async (
  contest: ContestRow,
  userId: string,
  entryType: Database['public']['Enums']['entry_type']
) => {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from('contest_entries')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contest.id)
    .eq('author_id', userId)
    .eq('entry_type', entryType)
    .neq('status', 'rejected');

  if (error) {
    throw new InternalServerError(error.message);
  }

  const limit =
    entryType === 'single'
      ? contest.single_submission_limit
      : contest.collection_submission_limit;

  if (limit > 0 && (count ?? 0) >= limit) {
    throw new ForbiddenError('已达到该类别的投稿上限');
  }
};

export interface ListContestEntriesOptions {
  status?: Database['public']['Enums']['entry_status'];
  authorId?: string;
  limit?: number;
  cursor?: string;
}

export const listContestEntries = async (
  contestId: string,
  options: ListContestEntriesOptions = {}
): Promise<{ items: ContestEntryWithImages[]; nextCursor: string | null }> => {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(options.limit ?? 20, 50);

  let query = supabase
    .from('contest_entries')
    .select(
      '*, contest_entry_images(*), profiles!contest_entries_author_id_fkey(id, display_name, avatar_url)'
    )
    .eq('contest_id', contestId)
    .order('submitted_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.authorId) {
    query = query.eq('author_id', options.authorId);
  }

  if (options.cursor) {
    query = query.lt('submitted_at', options.cursor);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error || !data) {
    throw new InternalServerError(error?.message ?? '加载投稿失败');
  }

  const items = (data as EntryRecord[]).map(mapEntry);
  const nextCursor = items.length === limit ? items.at(-1)?.submitted_at ?? null : null;

  return { items, nextCursor };
};

export const createContestEntry = async (
  userId: string,
  payload: CreateContestEntryInput
): Promise<ContestEntryWithImages> => {
  const input = createContestEntryInputSchema.parse(payload);
  const contest = await assertContestExists(input.contestId);
  ensureContestEditable(contest);
  await checkSubmissionLimit(contest, userId, input.entryType);

  const supabase = getSupabaseAdminClient();

  const { data: entry, error } = await supabase
    .from('contest_entries')
    .insert({
      contest_id: input.contestId,
      author_id: userId,
      entry_type: input.entryType,
      title: input.title,
      description: input.description ?? null
    })
    .select('*')
    .single();

  if (error || !entry) {
    throw new UnprocessableEntityError(error?.message ?? '提交投稿失败');
  }

  const imagesPayload = input.images.map((image, index) => ({
    entry_id: entry.id,
    storage_path: image.storagePath,
    thumbnail_path: image.thumbnailPath ?? null,
    width: image.width ?? null,
    height: image.height ?? null,
    sort_order: image.sortOrder ?? index
  }));

  const { error: imagesError } = await supabase.from('contest_entry_images').insert(imagesPayload);

  if (imagesError) {
    await supabase.from('contest_entries').delete().eq('id', entry.id);
    throw new UnprocessableEntityError(imagesError.message);
  }

  return getEntryById(entry.id);
};

export const updateContestEntry = async (
  entryId: string,
  actorId: string,
  payload: UpdateContestEntryInput
): Promise<ContestEntryWithImages> => {
  const supabase = getSupabaseAdminClient();
  const input = updateContestEntryInputSchema.parse(payload);

  const existing = await supabase
    .from('contest_entries')
    .select('*')
    .eq('id', entryId)
    .maybeSingle();

  if (existing.error) {
    throw new InternalServerError(existing.error.message);
  }

  if (!existing.data) {
    throw new NotFoundError('投稿不存在');
  }

  const contest = await assertContestExists(existing.data.contest_id);
  ensureContestEditable(contest);

  const role = await resolveUserRole(actorId);
  const isOwner = existing.data.author_id === actorId;
  const isAdmin = role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('无权编辑该投稿');
  }

  const updatePayload = {
    title: input.title ?? existing.data.title,
    description: input.description ?? existing.data.description
  };

  const { error } = await supabase.from('contest_entries').update(updatePayload).eq('id', entryId);

  if (error) {
    throw new UnprocessableEntityError(error.message);
  }

  if (input.images) {
    await supabase.from('contest_entry_images').delete().eq('entry_id', entryId);

    const imagesPayload = input.images.map((image, index) => ({
      entry_id: entryId,
      storage_path: image.storagePath,
      thumbnail_path: image.thumbnailPath ?? null,
      width: image.width ?? null,
      height: image.height ?? null,
      sort_order: image.sortOrder ?? index
    }));

    const { error: imageError } = await supabase.from('contest_entry_images').insert(imagesPayload);

    if (imageError) {
      throw new UnprocessableEntityError(imageError.message);
    }
  }

  return getEntryById(entryId);
};

export const deleteContestEntry = async (entryId: string, actorId: string) => {
  const supabase = getSupabaseAdminClient();
  const existing = await supabase
    .from('contest_entries')
    .select('contest_id, author_id')
    .eq('id', entryId)
    .maybeSingle();

  if (existing.error) {
    throw new InternalServerError(existing.error.message);
  }

  if (!existing.data) {
    throw new NotFoundError('投稿不存在');
  }

  const contest = await assertContestExists(existing.data.contest_id);
  ensureContestEditable(contest);

  const role = await resolveUserRole(actorId);
  const isOwner = existing.data.author_id === actorId;
  const isAdmin = role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('无权删除该投稿');
  }

  const { error } = await supabase.from('contest_entries').delete().eq('id', entryId);

  if (error) {
    throw new InternalServerError(error.message);
  }
};

export const updateContestEntryStatus = async (
  entryId: string,
  actorId: string,
  payload: { status: Database['public']['Enums']['entry_status']; notes?: string }
) => {
  const supabase = getSupabaseAdminClient();
  const { status, notes } = updateContestEntryStatusSchema.parse(payload);

  const role = await resolveUserRole(actorId);
  if (role !== 'admin') {
    throw new ForbiddenError('需要管理员权限');
  }

  const { data, error } = await supabase
    .from('contest_entries')
    .update({ status })
    .eq('id', entryId)
    .select('*')
    .single();

  if (error || !data) {
    throw new UnprocessableEntityError(error?.message ?? '更新投稿状态失败');
  }

  await supabase.from('contest_entry_audit_logs').insert({
    entry_id: entryId,
    action: status,
    operator_id: actorId,
    notes: notes ?? null
  });

  return getEntryById(entryId);
};
