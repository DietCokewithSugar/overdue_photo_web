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
    return (
      <div className="flex flex-col gap-6 pb-36">
        <Skeleton className="h-48 rounded-[28px]" />
        <Skeleton className="h-10 w-3/4 rounded-full" />
        <Skeleton className="h-40 rounded-[28px]" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="rounded-[24px] bg-red-100/70 p-4 text-sm text-red-500">
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
    <div className="flex flex-col gap-10 pb-36">
      <section className="space-y-6 px-5">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-neutral-900">{contest.title}</h1>
          <p className="text-sm text-neutral-500">
            {contest.description ?? '欢迎投稿你的故事，让更多人看到你的光影瞬间。'}
          </p>
        </div>

        {posterUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] bg-neutral-200">
            <Image
              src={posterUrl}
              alt={`${contest.title} 海报`}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 400px, 100vw"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-[24px] bg-neutral-100 px-4 py-3 text-xs text-neutral-600">
          <span>投稿时间：{start.toLocaleDateString()} - {end.toLocaleDateString()}</span>
          <span>投稿限制：单张 {singleLimitText} 张 · 图集 {collectionLimitText} 组</span>
          <span>单张文件不超过 {contest.single_file_size_limit_mb}MB</span>
        </div>

        <Link href={`/contests/${contestId}/submit`} className="block">
          <Button
            disabled={!inSubmission}
            className="w-full rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {inSubmission ? '立即投稿' : '投稿未开始或已结束'}
          </Button>
        </Link>
      </section>

      <section className="flex flex-col gap-6 px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">参赛作品</h2>
          <span className="text-xs text-neutral-400">共 {entries.length} 份投稿</span>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-neutral-200 px-6 py-10 text-center text-sm text-neutral-500">
            暂无公开投稿，成为第一位参赛者吧！
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 p-1 text-sm shadow-sm">
              <button
                type="button"
                onClick={() => setActiveGroup('single')}
                className={`flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
                  activeGroup === 'single'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                单张组
              </button>
              <button
                type="button"
                onClick={() => setActiveGroup('collection')}
                className={`flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
                  activeGroup === 'collection'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                图集组
              </button>
            </div>

            {activeEntries.length ? (
              <div className="flex flex-col gap-12">
                {activeEntries.map((entry) => (
                  <ContestEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-neutral-200 px-6 py-10 text-center text-sm text-neutral-500">
                {activeGroup === 'single' ? '暂无单张投稿' : '暂无图集投稿'}
              </div>
            )}
          </>
        )}

        {entriesQuery.hasNextPage ? (
          <Button
            variant="secondary"
            onClick={() => entriesQuery.fetchNextPage()}
            disabled={entriesQuery.isFetchingNextPage}
            className="mx-auto w-fit rounded-full border border-neutral-300 bg-white/80 px-6 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:border-neutral-400 hover:bg-white"
          >
            {entriesQuery.isFetchingNextPage ? '加载中…' : '更多投稿'}
          </Button>
        ) : null}
      </section>
    </div>
  );
}
