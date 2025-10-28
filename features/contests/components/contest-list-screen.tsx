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
      <div className="flex flex-col gap-6 pb-36">
        <Skeleton className="h-48 rounded-[28px]" />
        <Skeleton className="h-48 rounded-[28px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] bg-red-100/70 p-4 text-sm text-red-500">
        加载比赛列表失败，请稍后再试。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-36">
      <header className="space-y-3 px-5">
        <h1 className="text-2xl font-semibold text-neutral-900">比赛广场</h1>
        <p className="text-sm text-neutral-500">参加摄影比赛，获取灵感与荣誉。</p>
      </header>

      <div className="flex flex-col gap-6 px-5">
        {contests.map((contest) => (
          <ContestCard key={contest.id} contest={contest} />
        ))}
      </div>

      {hasNextPage ? (
        <Button
          variant="secondary"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto w-fit rounded-full border border-neutral-300 bg-white/80 px-6 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:border-neutral-400 hover:bg-white"
        >
          {isFetchingNextPage ? '加载中…' : '更多比赛'}
        </Button>
      ) : null}
    </div>
  );
}
