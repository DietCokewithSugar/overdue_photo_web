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
  createContestInputSchema,
  updateContestInputSchema,
  type CreateContestInput,
  type UpdateContestInput
} from './schema';

type ContestRow = Database['public']['Tables']['contests']['Row'];
type ContestStatsRow = Database['public']['Views']['contest_statistics']['Row'];

export type ContestWithStats = ContestRow & {
  totalEntries: number;
  approvedEntries: number;
  participantCount: number;
};

const mapContest = (contest: ContestRow, stats?: ContestStatsRow | null): ContestWithStats => ({
  ...contest,
  totalEntries: stats?.total_entries ?? 0,
  approvedEntries: stats?.approved_entries ?? 0,
  participantCount: stats?.participant_count ?? 0
});

const assertAdmin = async (userId: string) => {
  const role = await resolveUserRole(userId);
  if (role !== 'admin') {
    throw new ForbiddenError('需要管理员权限');
  }
};

const fetchContestStats = async (contestIds: string[]) => {
  if (contestIds.length === 0) {
    return new Map<string, ContestStatsRow>();
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('contest_statistics')
    .select('*')
    .in('contest_id', contestIds);

  if (error) {
    throw new InternalServerError(error.message);
  }

  return new Map((data ?? []).map((item) => [item.contest_id ?? '', item]));
};

export interface ListContestsOptions {
  status?: Database['public']['Enums']['contest_status'];
  limit?: number;
  cursor?: string;
}

export const listContests = async (
  options: ListContestsOptions = {}
): Promise<{ items: ContestWithStats[]; nextCursor: string | null }> => {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(options.limit ?? 20, 50);

  let query = supabase
    .from('contests')
    .select('*')
    .order('submission_starts_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  } else {
    query = query.in('status', ['published', 'closed']);
  }

  if (options.cursor) {
    query = query.lt('submission_starts_at', options.cursor);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error || !data) {
    throw new InternalServerError(error?.message ?? '加载比赛失败');
  }

  const statsMap = await fetchContestStats(data.map((contest) => contest.id));

  const items = data.map((contest) => mapContest(contest, statsMap.get(contest.id)));
  const nextCursor = items.length === limit ? items.at(-1)?.submission_starts_at ?? null : null;

  return { items, nextCursor };
};

export const createContest = async (
  actorId: string,
  payload: CreateContestInput
): Promise<ContestWithStats> => {
  await assertAdmin(actorId);
  const input = createContestInputSchema.parse(payload);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('contests')
    .insert({
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      poster_path: input.posterPath,
      submission_starts_at: input.submissionStartsAt,
      submission_ends_at: input.submissionEndsAt,
      single_submission_limit: input.singleSubmissionLimit,
      collection_submission_limit: input.collectionSubmissionLimit,
      single_file_size_limit_mb: input.singleFileSizeLimitMb,
      status: input.status,
      created_by: actorId
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new UnprocessableEntityError(error?.message ?? '创建比赛失败');
  }

  return mapContest(data, { contest_id: data.id, total_entries: 0, approved_entries: 0, participant_count: 0 });
};

export const getContestById = async (contestId: string): Promise<ContestWithStats> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('contests').select('*').eq('id', contestId).maybeSingle();

  if (error) {
    throw new InternalServerError(error.message);
  }

  if (!data) {
    throw new NotFoundError('比赛不存在');
  }

  const statsMap = await fetchContestStats([contestId]);
  return mapContest(data, statsMap.get(contestId));
};

export const updateContest = async (
  contestId: string,
  actorId: string,
  payload: UpdateContestInput
): Promise<ContestWithStats> => {
  await assertAdmin(actorId);
  const supabase = getSupabaseAdminClient();
  const input = updateContestInputSchema.parse(payload);

  const existing = await supabase.from('contests').select('*').eq('id', contestId).maybeSingle();

  if (existing.error) {
    throw new InternalServerError(existing.error.message);
  }

  if (!existing.data) {
    throw new NotFoundError('比赛不存在');
  }

  const updatePayload = {
    title: input.title ?? existing.data.title,
    slug: input.slug ?? existing.data.slug,
    description: input.description ?? existing.data.description,
    poster_path: input.posterPath ?? existing.data.poster_path,
    submission_starts_at: input.submissionStartsAt ?? existing.data.submission_starts_at,
    submission_ends_at: input.submissionEndsAt ?? existing.data.submission_ends_at,
    single_submission_limit: input.singleSubmissionLimit ?? existing.data.single_submission_limit,
    collection_submission_limit:
      input.collectionSubmissionLimit ?? existing.data.collection_submission_limit,
    single_file_size_limit_mb:
      input.singleFileSizeLimitMb ?? existing.data.single_file_size_limit_mb,
    status: input.status ?? existing.data.status
  };

  const { data, error } = await supabase
    .from('contests')
    .update(updatePayload)
    .eq('id', contestId)
    .select('*')
    .single();

  if (error || !data) {
    throw new UnprocessableEntityError(error?.message ?? '更新比赛失败');
  }

  const stats = await fetchContestStats([contestId]);
  return mapContest(data, stats.get(contestId));
};
