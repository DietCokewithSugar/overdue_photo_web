'use client';

import { useMemo, useState } from 'react';

import type { PostDto } from '@/features/posts/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminPosts, useDeletePost, useUpdatePostMeta } from './hooks';

const STATUS_TABS: Array<{ label: string; value?: 'draft' | 'published' | 'archived' }> = [
  { label: '全部', value: undefined },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' }
];

export function AdminPostsTable() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['value']>();
  const postsQuery = useAdminPosts(status);
  const updateMutation = useUpdatePostMeta();
  const deleteMutation = useDeletePost();

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data]
  );

  const handleToggleFeatured = (post: PostDto) => {
    updateMutation.mutate({
      postId: post.id,
      payload: { is_featured: !post.is_featured }
    });
  };

  const handleChangeStatus = (post: PostDto, nextStatus: 'draft' | 'published' | 'archived') => {
    updateMutation.mutate({
      postId: post.id,
      payload: { status: nextStatus }
    });
  };

  const handleDelete = (postId: string) => {
    if (confirm('确定要删除该帖子？此操作不可撤销。')) {
      deleteMutation.mutate(postId);
    }
  };

  return (
    <section className="flex flex-col gap-6">
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

      {postsQuery.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/5">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/5 text-neutral-400">
              <tr>
                <th className="px-4 py-3 text-left">标题</th>
                <th className="px-4 py-3 text-left">作者</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">点赞 / 评论</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-white/5">
                  <td className="max-w-xs px-4 py-4">
                    <div className="font-medium text-neutral-50 line-clamp-2">{post.title}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-neutral-400">{post.author_id.slice(0, 8)}…</td>
                  <td className="px-4 py-4 text-xs text-neutral-400">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 capitalize text-neutral-200">
                        {post.status}
                      </span>
                      {post.is_featured && (
                        <span className="text-brand-300">精选</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-neutral-400">
                    ❤️ {post.likesCount} / 💬 {post.commentsCount}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2 text-xs">
                      <Button
                        variant="secondary"
                        className="h-8"
                        type="button"
                        onClick={() => handleToggleFeatured(post)}
                        disabled={updateMutation.isPending}
                      >
                        {post.is_featured ? '取消精选' : '设为精选'}
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8"
                        type="button"
                        onClick={() => handleChangeStatus(post, post.status === 'published' ? 'archived' : 'published')}
                        disabled={updateMutation.isPending}
                      >
                        {post.status === 'published' ? '归档' : '发布'}
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8 text-red-300"
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        disabled={deleteMutation.isPending}
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {posts.length === 0 && !postsQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {postsQuery.hasNextPage && (
        <Button
          variant="secondary"
          className="self-center"
          onClick={() => postsQuery.fetchNextPage()}
          disabled={postsQuery.isFetchingNextPage}
        >
          {postsQuery.isFetchingNextPage ? '加载中…' : '加载更多'}
        </Button>
      )}
    </section>
  );
}
