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
      <div className="grid grid-cols-1 gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[360px] w-full" />
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasNextPage ? (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="secondary">
          {isFetchingNextPage ? '加载中…' : '加载更多作品'}
        </Button>
      ) : (
        <p className="text-center text-xs text-neutral-500">已经到底了，去创作新作品吧！</p>
      )}
    </div>
  );
}
