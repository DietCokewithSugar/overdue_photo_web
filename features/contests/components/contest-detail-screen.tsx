'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useContestEntriesQuery, useContestQuery } from '@/features/contests/hooks';
import { getPublicImageUrl } from '@/lib/storage-path';

import { ContestEntryCard } from './contest-entry-card';

interface ContestDetailScreenProps {
  contestId: string;
}

export function ContestDetailScreen({ contestId }: ContestDetailScreenProps) {
  const { data: contest, isLoading, error } = useContestQuery(contestId);
  const entriesQuery = useContestEntriesQuery(contestId);
  const entries = entriesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const singleEntries = entries.filter((entry) => entry.entry_type === 'single');
  const collectionEntries = entries.filter((entry) => entry.entry_type === 'collection');
  const [activeGroup, setActiveGroup] = useState<'single' | 'collection'>('single');

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (error || !contest) {
    return (
      <div className="rounded-3xl bg-red-500/10 p-4 text-sm text-red-300">
        未找到比赛，可能已下线。
      </div>
    );
  }

  const now = new Date();
  const start = new Date(contest.submission_starts_at);
  const end = new Date(contest.submission_ends_at);
  const inSubmission = now >= start && now <= end;
  const posterUrl = contest.poster_path
    ? getPublicImageUrl(contest.poster_path, { width: 1200, height: 640, resize: 'cover' })
    : null;
  const activeEntries = activeGroup === 'single' ? singleEntries : collectionEntries;
  const singleLimitText =
    contest.single_submission_limit > 0 ? contest.single_submission_limit : '不限';
  const collectionLimitText =
    contest.collection_submission_limit > 0 ? contest.collection_submission_limit : '不限';

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-neutral-50">{contest.title}</h1>
        <p className="text-sm text-neutral-400">{contest.description ?? '欢迎投稿你的故事。'}</p>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-300">
          投稿时间：{start.toLocaleDateString()} - {end.toLocaleDateString()}
        </div>
        {posterUrl && (
          <div className="relative h-56 w-full overflow-hidden rounded-3xl">
            <Image
              src={posterUrl}
              alt={`${contest.title} 海报`}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 400px, 100vw"
            />
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>投稿限制：单张 {singleLimitText} 张 · 图集 {collectionLimitText} 组</span>
          <span>单张 ≤ {contest.single_file_size_limit_mb}MB</span>
        </div>
        <Link href={`/contests/${contestId}/submit`} className="w-full">
          <Button disabled={!inSubmission} className="w-full">
            {inSubmission ? '立即投稿' : '投稿未开始或已结束'}
          </Button>
        </Link>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-100">参赛作品</h2>
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">
            暂无公开投稿，成为第一位参赛者吧！
          </div>
        ) : (
          <>
            <div className="flex gap-2 rounded-full bg-white/5 p-1 text-sm text-neutral-300">
              <button
                type="button"
                onClick={() => setActiveGroup('single')}
                className={`flex-1 rounded-full px-4 py-2 ${
                  activeGroup === 'single' ? 'bg-white text-neutral-900' : ''
                }`}
              >
                单张组
              </button>
              <button
                type="button"
                onClick={() => setActiveGroup('collection')}
                className={`flex-1 rounded-full px-4 py-2 ${
                  activeGroup === 'collection' ? 'bg-white text-neutral-900' : ''
                }`}
              >
                图集组
              </button>
            </div>

            {activeEntries.length ? (
              <div className="grid grid-cols-1 gap-4">
                {activeEntries.map((entry) => (
                  <ContestEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">
                {activeGroup === 'single' ? '暂无单张投稿' : '暂无图集投稿'}
              </div>
            )}
          </>
        )}

        {entriesQuery.hasNextPage && (
          <Button
            variant="secondary"
            onClick={() => entriesQuery.fetchNextPage()}
            disabled={entriesQuery.isFetchingNextPage}
          >
            {entriesQuery.isFetchingNextPage ? '加载中…' : '更多投稿'}
          </Button>
        )}
      </section>
    </div>
  );
}
