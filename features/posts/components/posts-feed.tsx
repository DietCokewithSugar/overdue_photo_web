'use client';

import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { usePostsQuery } from '../hooks';
import type { PostsFilter } from '../api';
import { PostCard } from './post-card';

interface PostsFeedProps {
  filter: PostsFilter;
}

export function PostsFeed({ filter }: PostsFeedProps) {
  const { data, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage, error } =
    usePostsQuery(filter);

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-4">
            <Skeleton className="h-[340px] w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
        加载帖子时出现问题，请稍后重试。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasNextPage ? (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          variant="secondary"
          className="mx-auto w-fit rounded-full border border-neutral-300 bg-white/80 px-6 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:border-neutral-400 hover:bg-white"
        >
          {isFetchingNextPage ? '加载中…' : '加载更多作品'}
        </Button>
      ) : (
        <p className="text-center text-xs text-neutral-400">已经到底了，去创作新作品吧！</p>
      )}
    </div>
  );
}
