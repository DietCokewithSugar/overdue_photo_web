'use client';

import { FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useCommentsQuery, useCreateComment } from '../hooks';

interface CommentsSectionProps {
  postId: string;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommentsQuery(postId);
  const createComment = useCreateComment(postId);
  const [body, setBody] = useState('');

  const comments = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim()) return;

    await createComment.mutateAsync({ body: body.trim() });
    setBody('');
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-neutral-100">评论</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-3xl border border-white/5 p-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="写下你的想法…"
          rows={3}
          className="w-full resize-none rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        />
        <Button type="submit" disabled={createComment.isPending || !body.trim()}>
          {createComment.isPending ? '发送中…' : '发表评论'}
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : comments.length === 0 ? (
          <p className="text-sm text-neutral-500">暂时还没有评论，快来抢第一条吧！</p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-3xl border border-white/5 bg-neutral-900/40 p-4 text-sm text-neutral-200"
            >
              <div className="mb-2 text-xs text-neutral-500">
                {comment.author?.display_name ?? '匿名用户'} ·{' '}
                {new Date(comment.created_at).toLocaleString()}
              </div>
              <p>{comment.body}</p>
            </article>
          ))
        )}
      </div>

      {hasNextPage && (
        <Button
          variant="secondary"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? '加载中…' : '加载更多评论'}
        </Button>
      )}
    </section>
  );
}
