'use client';

import { useContestsQuery } from '@/features/contests/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { ContestCard } from './contest-card';

export function ContestListScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, error } =
    useContestsQuery();

  const contests = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-red-500/10 p-4 text-sm text-red-300">
        加载比赛列表失败，请稍后再试。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-50">比赛广场</h1>
        <p className="text-sm text-neutral-400">参加摄影比赛，获取灵感与荣誉。</p>
      </header>

      <div className="flex flex-col gap-4">
        {contests.map((contest) => (
          <ContestCard key={contest.id} contest={contest} />
        ))}
      </div>

      {hasNextPage && (
        <Button
          variant="secondary"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? '加载中…' : '更多比赛'}
        </Button>
      )}
    </div>
  );
}
