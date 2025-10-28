'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminContests, useUpdateContest } from './hooks';

const STATUS_TABS: Array<{ label: string; value?: 'draft' | 'published' | 'closed' }> = [
  { label: '全部', value: undefined },
  { label: '草稿', value: 'draft' },
  { label: '进行中', value: 'published' },
  { label: '已结束', value: 'closed' }
];

export function AdminContestList() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['value']>();
  const contestsQuery = useAdminContests(status);
  const updateMutation = useUpdateContest();

  const contests = useMemo(
    () => contestsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [contestsQuery.data]
  );

  const handlePublishToggle = (contestId: string, nextStatus: 'draft' | 'published' | 'closed') => {
    updateMutation.mutate({ contestId, payload: { status: nextStatus } });
  };

  if (contestsQuery.isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.label}
            variant={status === tab.value ? 'primary' : 'secondary'}
            className="h-9 rounded-full"
            type="button"
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead className="bg-white/5 text-neutral-400">
            <tr>
              <th className="px-4 py-3 text-left">比赛</th>
              <th className="px-4 py-3 text-left">投稿时间</th>
              <th className="px-4 py-3 text-left">投稿统计</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-neutral-200">
            {contests.map((contest) => (
              <tr key={contest.id} className="hover:bg-white/5">
                <td className="max-w-xs px-4 py-4">
                  <div className="text-neutral-50">{contest.title}</div>
                  <div className="mt-1 text-xs text-neutral-500 capitalize">{contest.status}</div>
                </td>
                <td className="px-4 py-4 text-xs text-neutral-400">
                  {new Date(contest.submission_starts_at).toLocaleDateString()} -{' '}
                  {new Date(contest.submission_ends_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-xs text-neutral-400">
                  通过 {contest.approvedEntries} / 总计 {contest.totalEntries}
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2 text-xs">
                    {contest.status !== 'published' && (
                      <Button
                        variant="secondary"
                        className="h-8"
                        type="button"
                        onClick={() => handlePublishToggle(contest.id, 'published')}
                        disabled={updateMutation.isPending}
                      >
                        发布
                      </Button>
                    )}
                    {contest.status === 'published' && (
                      <Button
                        variant="secondary"
                        className="h-8"
                        type="button"
                        onClick={() => handlePublishToggle(contest.id, 'closed')}
                        disabled={updateMutation.isPending}
                      >
                        结束
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {contests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-neutral-500">
                  暂无比赛数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {contestsQuery.hasNextPage && (
        <Button
          variant="secondary"
          className="self-center"
          onClick={() => contestsQuery.fetchNextPage()}
          disabled={contestsQuery.isFetchingNextPage}
        >
          {contestsQuery.isFetchingNextPage ? '加载中…' : '加载更多'}
        </Button>
      )}
    </div>
  );
}
