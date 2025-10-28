'use client';

import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminComments, useDeleteCommentAdmin } from './hooks';

export function AdminCommentsTable() {
  const commentsQuery = useAdminComments();
  const deleteMutation = useDeleteCommentAdmin();

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [commentsQuery.data]
  );

  const handleDelete = (id: string) => {
    if (confirm('确认删除该评论？')) {
      deleteMutation.mutate(id);
    }
  };

  if (commentsQuery.isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-3xl border border-white/5">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead className="bg-white/5 text-neutral-400">
            <tr>
              <th className="px-4 py-3 text-left">评论内容</th>
              <th className="px-4 py-3 text-left">帖子</th>
              <th className="px-4 py-3 text-left">作者</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-neutral-200">
            {comments.map((comment) => (
              <tr key={comment.id} className="hover:bg-white/5">
                <td className="max-w-md px-4 py-4">
                  <p className="text-neutral-50 line-clamp-2">{comment.body}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </td>
                <td className="px-4 py-4 text-xs text-neutral-400">
                  {comment.posts?.title ?? '未知帖子'}
                </td>
                <td className="px-4 py-4 text-xs text-neutral-400">
                  {comment.profiles?.display_name ?? comment.author_id.slice(0, 8)}
                </td>
                <td className="px-4 py-4 text-xs text-neutral-400 capitalize">{comment.status}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="h-8 text-red-300"
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteMutation.isPending}
                    >
                      删除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {comments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                  暂无评论数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {commentsQuery.hasNextPage && (
        <Button
          variant="secondary"
          className="self-center"
          onClick={() => commentsQuery.fetchNextPage()}
          disabled={commentsQuery.isFetchingNextPage}
        >
          {commentsQuery.isFetchingNextPage ? '加载中…' : '加载更多'}
        </Button>
      )}
    </div>
  );
}
