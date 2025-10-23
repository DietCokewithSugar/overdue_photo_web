'use client';

import { useAdminOverview, type OverviewStats } from './hooks';
import { Skeleton } from '@/components/ui/skeleton';

const CARDS: Array<{
  key: keyof OverviewStats;
  title: string;
  description: string;
}> = [
  { key: 'posts', title: '帖子总数', description: '包含草稿与已发布帖子' },
  { key: 'comments', title: '评论总数', description: '所有用户评论数量' },
  { key: 'contests', title: '比赛数量', description: '已创建的摄影比赛' },
  { key: 'pendingEntries', title: '待审核投稿', description: '当前等待审核的比赛投稿' }
];

export function OverviewCards() {
  const { data, isLoading } = useAdminOverview();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((card) => (
          <Skeleton key={card.key} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="flex flex-col gap-2 rounded-3xl border border-white/5 bg-neutral-900/60 px-5 py-6"
        >
          <span className="text-sm text-neutral-400">{card.title}</span>
          <span className="text-3xl font-semibold text-neutral-50">
            {data?.[card.key] ?? 0}
          </span>
          <span className="text-xs text-neutral-500">{card.description}</span>
        </div>
      ))}
    </div>
  );
}
