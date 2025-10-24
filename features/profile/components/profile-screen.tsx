'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Route } from 'next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/features/profile/hooks';
import { useSignOut } from '@/features/auth/hooks';
import { useUserPosts } from '@/features/posts/hooks';
import { useUserContestEntries } from '@/features/contests/hooks';
import { getPublicImageUrl } from '@/lib/storage-path';

const getInitials = (name?: string | null) => {
  const trimmed = name?.trim();
  if (trimmed) {
    const chars = Array.from(trimmed);
    return chars.slice(0, 2).join('').toUpperCase();
  }
  return '我';
};

interface ContestGroup {
  contest: {
    id: string;
    title: string;
    submission_starts_at: string;
    submission_ends_at: string;
    status: 'draft' | 'published' | 'closed';
  };
  entriesCount: number;
}

export function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const signOutMutation = useSignOut();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'contests'>('posts');

  const userPostsQuery = useUserPosts(Boolean(profile) && activeTab === 'posts');
  const userContestEntriesQuery = useUserContestEntries(Boolean(profile) && activeTab === 'contests');

  const userPosts = useMemo(
    () =>
      userPostsQuery.data?.pages
        .flatMap((page) => page.items)
        .filter((post) => post.status === 'published' && post.images?.length) ?? [],
    [userPostsQuery.data]
  );

  const contestGroups = useMemo<ContestGroup[]>(() => {
    const map = new Map<string, ContestGroup>();
    userContestEntriesQuery.data?.pages.forEach((page) => {
      page.items.forEach((entry) => {
        const contest = entry.contest ?? {
          id: entry.contest_id,
          title: '已归档比赛',
          submission_starts_at: entry.submitted_at,
          submission_ends_at: entry.submitted_at,
          status: 'closed' as const
        };
        const group = map.get(contest.id);
        if (group) {
          group.entriesCount += 1;
        } else {
          map.set(contest.id, {
            contest,
            entriesCount: 1
          });
        }
      });
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.contest.submission_ends_at).getTime() -
        new Date(a.contest.submission_ends_at).getTime()
    );
  }, [userContestEntriesQuery.data]);

  const renderPostThumbnail = (post: (typeof userPosts)[number]) => {
    const preview = getPublicImageUrl(
      post.images?.[0]?.thumbnail_path ?? post.images?.[0]?.storage_path,
      {
        width: 400,
        height: 400,
        resize: 'cover'
      }
    );

    return (
      <Link
        key={post.id}
        href={`/profile/posts/${post.id}` as Route}
        className="relative block aspect-square overflow-hidden bg-neutral-200"
      >
        {preview ? (
          <img src={preview} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
            无封面
          </div>
        )}
      </Link>
    );
  };

  const renderContestCard = (group: ContestGroup) => {
    const now = Date.now();
    const start = new Date(group.contest.submission_starts_at).getTime();
    const end = new Date(group.contest.submission_ends_at).getTime();

    let statusLabel = '已结束';
    if (now < start) {
      statusLabel = '未开始';
    } else if (now <= end) {
      statusLabel = '进行中';
    }

    return (
      <Link
        key={group.contest.id}
        href={`/profile/contest-entries/${group.contest.id}` as Route}
        className="flex flex-col gap-2 rounded-[24px] border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.3)]"
      >
        <h3 className="text-sm font-semibold text-neutral-900">{group.contest.title}</h3>
        <p className="text-xs text-neutral-500">
          状态：{statusLabel} · {group.entriesCount} 个作品
        </p>
        <p className="text-xs text-neutral-400">
          投稿窗口：{new Date(group.contest.submission_starts_at).toLocaleDateString()} -
          {new Date(group.contest.submission_ends_at).toLocaleDateString()}
        </p>
        <span className="mt-1 inline-flex h-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs font-medium text-neutral-700">
          管理参赛作品
        </span>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-36 px-5">
        <Skeleton className="h-48 rounded-[28px]" />
        <Skeleton className="h-40 rounded-[24px]" />
        <Skeleton className="h-40 rounded-[24px]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-8 pb-36 px-5">
        <section className="space-y-5">
          <div className="flex flex-col items-center gap-4 rounded-[28px] bg-white px-6 py-10 text-center text-neutral-700 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
              游
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">未登录用户</h1>
              <p className="mt-1 text-sm text-neutral-500">登录后浏览我的帖子、比赛投稿与收藏。</p>
            </div>
            <Link href={'/login' as Route} className="w-full">
              <Button className="w-full rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800">
                登录 / 注册
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-neutral-200 bg-white px-5 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">我的帖子</h2>
              <p className="mt-2 text-xs text-neutral-500">登录后可快速查看与管理自己发布的作品。</p>
            </div>
            <div className="rounded-[24px] border border-neutral-200 bg-white px-5 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">比赛投稿</h2>
              <p className="mt-2 text-xs text-neutral-500">在此管理你参与比赛的作品，查看审核状态。</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const initials = getInitials(profile.display_name);
  const roleLabel = profile.role === 'admin' ? '管理员' : '普通用户';

  return (
    <div className="flex flex-col gap-8 pb-36 px-5">
      <section className="space-y-5">
        <div className="flex flex-col items-center gap-4 rounded-[28px] bg-white px-6 py-10 text-center text-neutral-700 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
            {initials}
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-neutral-900">{profile.display_name}</h1>
            <p className="text-sm text-neutral-500">{profile.bio ?? '欢迎继续完善个人资料。'}</p>
            <span className="inline-flex items-center rounded-full bg-neutral-200 px-3 py-1 text-xs text-neutral-600">
              {roleLabel}
            </span>
          </div>
          <Button
            className="w-full rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
            disabled={signOutMutation.isPending}
            onClick={() =>
              signOutMutation.mutate(undefined, {
                onSuccess: () => router.push('/login')
              })
            }
          >
            {signOutMutation.isPending ? '退出中…' : '退出登录'}
          </Button>

          {profile.role === 'admin' && (
            <Link href={'/admin' as Route} className="w-full">
              <Button className="w-full rounded-full border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                进入管理后台
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 p-1 text-sm shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            我的照片
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contests')}
            className={`flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
              activeTab === 'contests'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            比赛记录
          </button>
        </div>
      </section>

      {activeTab === 'posts' ? (
        <section className="flex flex-col gap-4">
          {userPosts.length === 0 && !userPostsQuery.isFetching ? (
            <p className="text-xs text-neutral-500">暂时还没有发布作品，快去分享你的第一张照片吧！</p>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] sm:gap-2">
              {userPosts.map((post) => renderPostThumbnail(post))}
              {userPostsQuery.isFetchingNextPage ? (
                <Skeleton className="aspect-square" />
              ) : null}
            </div>
          )}

          {userPostsQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => userPostsQuery.fetchNextPage()}
              disabled={userPostsQuery.isFetchingNextPage}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {userPostsQuery.isFetchingNextPage ? '加载中…' : '加载更多'}
            </button>
          ) : null}
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          {contestGroups.length === 0 && !userContestEntriesQuery.isFetching ? (
            <p className="text-xs text-neutral-500">还没有参赛记录，去比赛页面参与投稿吧。</p>
          ) : (
            <div className="grid gap-4">
              {contestGroups.map((group) => renderContestCard(group))}
              {userContestEntriesQuery.isFetchingNextPage ? (
                <Skeleton className="h-32 rounded-[24px]" />
              ) : null}
            </div>
          )}

          {userContestEntriesQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => userContestEntriesQuery.fetchNextPage()}
              disabled={userContestEntriesQuery.isFetchingNextPage}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {userContestEntriesQuery.isFetchingNextPage ? '加载中…' : '加载更多'}
            </button>
          ) : null}
        </section>
      )}
    </div>
  );
}
