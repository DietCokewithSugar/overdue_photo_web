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
      className="flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-neutral-900"
      prefetch
    >
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-brand-500/10 to-brand-500/5">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={contest.title}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 320px, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-brand-200/80">
            <TrophyIcon size={48} />
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-neutral-200">
          {statusText[contest.status]}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4 text-sm">
        <h3 className="text-lg font-semibold text-neutral-50">{contest.title}</h3>
        <p className="line-clamp-2 text-neutral-400">{contest.description ?? '欢迎投稿你的特别作品，相遇光影故事。'}</p>

        <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-neutral-300">
          投稿时间：{start} - {end}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-neutral-300">
          <span>单张限投 {singleLimitText}</span>
          <span className="text-right">图集限投 {collectionLimitText}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>投稿 {contest.approvedEntries}/{contest.totalEntries}</span>
          <span>参与者 {contest.participantCount}</span>
        </div>
      </div>
    </Link>
  );
}
