'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Route } from 'next';
import type { Route } from 'next';

import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon, TrashIcon } from '@/components/icons';
import { useContestEntriesQuery, useContestQuery, useDeleteContestEntryMutation } from '@/features/contests/hooks';
import { getPublicImageUrl } from '@/lib/storage-path';

interface ProfileContestEntriesScreenProps {
  contestId: string;
}

export function ProfileContestEntriesScreen({ contestId }: ProfileContestEntriesScreenProps) {
  const router = useRouter();
  const { data: contest, isLoading: contestLoading, error: contestError } = useContestQuery(contestId);
  const entriesQuery = useContestEntriesQuery(contestId, { mine: true, status: undefined });
  const deleteEntryMutation = useDeleteContestEntryMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const entries = useMemo(
    () => entriesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [entriesQuery.data]
  );

  const canManage = useMemo(() => {
    if (!contest) return false;
    const now = Date.now();
    const start = new Date(contest.submission_starts_at).getTime();
    const end = new Date(contest.submission_ends_at).getTime();
    return now >= start && now <= end;
  }, [contest]);

  const handleDelete = (entryId: string) => {
    if (!canManage || deleteEntryMutation.isPending || deletingId) return;
    if (!window.confirm('确定要删除该参赛作品吗？删除后无法恢复。')) return;
    setDeletingId(entryId);
    deleteEntryMutation.mutate(entryId, {
      onError: () => setDeletingId(null),
      onSuccess: () => {
        setDeletingId(null);
        entriesQuery.refetch();
      }
    });
  };

  if (contestLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="space-y-4 p-5">
          <Skeleton className="h-32 rounded-[28px]" />
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (contestError || !contest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <p className="text-sm text-neutral-500">无法加载比赛信息。</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="返回"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="text-base font-semibold text-neutral-900">{contest.title}</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="flex-1 space-y-6 px-5 pb-16">
        <section className="rounded-[28px] border border-neutral-200 bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-neutral-900">投稿时间</h2>
          <p className="mt-1 text-xs text-neutral-500">
            {new Date(contest.submission_starts_at).toLocaleDateString()} - {new Date(contest.submission_ends_at).toLocaleDateString()}
          </p>
          <p className="mt-3 text-xs text-neutral-500">
            当前状态：
            {canManage ? '投稿进行中，可删除作品' : '投稿已结束，仅可查看提交内容'}
          </p>
          <Link
            href={`/contests/${contestId}` as Route}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-neutral-300 bg-white px-4 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            查看比赛详情
          </Link>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">我的参赛作品</h2>
            {entriesQuery.isFetching && entries.length === 0 ? (
              <span className="text-xs text-neutral-400">加载中…</span>
            ) : null}
          </div>

          {entries.length === 0 && !entriesQuery.isFetching ? (
            <p className="text-xs text-neutral-500">尚未提交作品，快去投稿吧！</p>
          ) : (
            <div className="grid gap-4">
              {entries.map((entry) => {
                const preview = getPublicImageUrl(entry.images?.[0]?.thumbnail_path ?? entry.images?.[0]?.storage_path, {
                  width: 320,
                  height: 320,
                  resize: 'cover'
                });
                const originalUrl = getPublicImageUrl(entry.images?.[0]?.storage_path, {
                  quality: 90
                });
                const deleting = deletingId === entry.id;
                const canDeleteEntry = canManage;
                return (
                  <div key={entry.id} className="rounded-[24px] border border-neutral-200 bg-white px-5 py-4">
                    <div className="flex items-start gap-4">
                      <a
                        href={originalUrl ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-20 w-20 overflow-hidden rounded-[18px] bg-neutral-200"
                      >
                        {preview ? (
                          <img src={preview} alt={entry.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">无封面</div>
                        )}
                      </a>
                      <div className="flex flex-1 flex-col gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900">{entry.title}</h3>
                          <p className="text-xs text-neutral-500">
                            {entry.entry_type === 'single' ? '单张组' : '图集组'} · 提交于{' '}
                            {new Date(entry.submitted_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-neutral-400">
                            状态：{entry.status === 'approved' ? '已通过' : entry.status === 'pending' ? '待审核' : '已驳回'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/contests/${contestId}` as Route}
                            className="flex h-9 flex-1 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                          >
                            查看比赛
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            disabled={!canDeleteEntry || deleting}
                            className="flex h-9 flex-1 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                            title={canDeleteEntry ? undefined : '比赛已结束，无法删除'}
                          >
                            {deleting ? '删除中…' : canDeleteEntry ? (
                              <span className="flex items-center gap-1"><TrashIcon size={14} /> 删除</span>
                            ) : (
                              '不可删除'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {entriesQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => entriesQuery.fetchNextPage()}
              disabled={entriesQuery.isFetchingNextPage}
              className="w-full rounded-full border border-neutral-300 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {entriesQuery.isFetchingNextPage ? '加载中…' : '加载更多'}
            </button>
          ) : null}
        </section>
      </main>
    </div>
  );
}
