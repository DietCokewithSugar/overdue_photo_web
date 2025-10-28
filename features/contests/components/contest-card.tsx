'use client';

import Link from 'next/link';
import type { Route } from 'next';

import type { ContestDto } from '@/features/contests/types';
import Image from 'next/image';

import { TrophyIcon } from '@/components/icons';
import { getPublicImageUrl } from '@/lib/storage-path';

interface ContestCardProps {
  contest: ContestDto;
}

const statusText: Record<ContestDto['status'], string> = {
  draft: '筹备中',
  published: '征稿中',
  closed: '已结束'
};

export function ContestCard({ contest }: ContestCardProps) {
  const href = `/contests/${contest.id}` as Route;
  const start = new Date(contest.submission_starts_at).toLocaleDateString();
  const end = new Date(contest.submission_ends_at).toLocaleDateString();
  const posterUrl = contest.poster_path
    ? getPublicImageUrl(contest.poster_path, { width: 640, height: 360, resize: 'cover' })
    : null;
  const singleLimitText =
    contest.single_submission_limit > 0 ? contest.single_submission_limit : '不限';
  const collectionLimitText =
    contest.collection_submission_limit > 0 ? contest.collection_submission_limit : '不限';

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[28px] bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/20"
      prefetch
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-200">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={contest.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(min-width: 768px) 320px, 100vw"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
            <TrophyIcon size={48} />
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
          {statusText[contest.status]}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-neutral-900">{contest.title}</h3>
          <p className="line-clamp-2 text-sm text-neutral-500">
            {contest.description ?? '欢迎投稿你的特别作品，相遇光影故事。'}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-xs text-neutral-600">
          <span>投稿时间：{start} - {end}</span>
          <div className="flex items-center justify-between text-neutral-500">
            <span>单张限投 {singleLimitText}</span>
            <span>图集限投 {collectionLimitText}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>投稿 {contest.approvedEntries}/{contest.totalEntries}</span>
          <span>参与者 {contest.participantCount}</span>
        </div>
      </div>
    </Link>
  );
}
