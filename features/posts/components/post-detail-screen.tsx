'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLikeMutation, usePostQuery } from '@/features/posts/hooks';

import { CommentsSection } from '@/features/comments/components/comments-section';

interface PostDetailScreenProps {
  postId: string;
}

export function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const { data: post, isLoading, error } = usePostQuery(postId);
  const likeMutation = useLikeMutation(postId);
  const router = useRouter();

  if (isLoading) {
    return <Skeleton className="h-[400px]" />;
  }

  if (error || !post) {
    return (
      <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
        无法加载帖子，可能已被删除。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← 返回
      </button>

      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-neutral-50">{post.title}</h1>
        {post.content_plaintext ? (
          <p className="text-sm leading-relaxed text-neutral-300">{post.content_plaintext}</p>
        ) : null}

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>发布于 {new Date(post.created_at).toLocaleDateString()}</span>
          {post.is_featured && <span className="rounded-full bg-brand-500/15 px-2 py-1 text-brand-300">精选</span>}
        </div>
      </div>

      <div className="grid gap-3">
        {post.images?.map((image) => (
          <div
            key={image.id}
            className="h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80"
          >
            <div className="flex h-full w-full items-center justify-center text-neutral-500">
              <span>图片文件：{image.storage_path.split('/').pop()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-white/5 px-4 py-3">
        <div className="text-sm text-neutral-300">
          ❤️ {post.likesCount} · 💬 {post.commentsCount}
        </div>
        <Button
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          variant="secondary"
        >
          {likeMutation.isPending ? '点赞中…' : '为作品点赞'}
        </Button>
      </div>

      <CommentsSection postId={postId} />

      <div className="rounded-3xl bg-white/5 p-4 text-sm text-neutral-400">
        想要投稿更多作品？前往{' '}
        <Link href="/contests" className="text-brand-300 underline">
          比赛专区
        </Link>
        。
      </div>
    </div>
  );
}
