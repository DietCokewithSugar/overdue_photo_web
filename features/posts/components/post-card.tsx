'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { HeartIcon, ImageIcon, MessageCircleIcon } from '@/components/icons';
import { useCommentsPreview, useCreateComment } from '@/features/comments/hooks';
import type { PostDto } from '@/features/posts/types';
import { useLikeMutation, useUnlikeMutation } from '@/features/posts/hooks';
import { getAuthorInitials, getAuthorLabel, getPostPublishedDate } from '@/features/posts/utils';
import { getPublicImageUrl } from '@/lib/storage-path';
import { Skeleton } from '@/components/ui/skeleton';

interface PostCardProps {
  post: PostDto;
}

export function PostCard({ post }: PostCardProps) {
  const href = `/posts/${post.id}` as Route;
  const coverUrl = getPublicImageUrl(post.images?.[0]?.storage_path, {
    width: 1400,
    height: 1400,
    resize: 'cover'
  });

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [commentBody, setCommentBody] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  const likeMutation = useLikeMutation(post.id);
  const unlikeMutation = useUnlikeMutation(post.id);
  const commentMutation = useCreateComment(post.id);

  const { data: commentsData, isLoading: commentsLoading } = useCommentsPreview(post.id, 10);

  const comments = commentsData?.items ?? [];
  const displayedComments = useMemo(() => comments.slice(-3), [comments]);
  const hasMoreComments = comments.length > 3 || Boolean(commentsData?.nextCursor);

  const handleToggleLike = async () => {
    if (likeMutation.isPending || unlikeMutation.isPending) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));

    try {
      const result = nextLiked
        ? await likeMutation.mutateAsync()
        : await unlikeMutation.mutateAsync();

      setLikeCount(result.likesCount);
    } catch (error) {
      // revert optimistic updates when request fails
      setLiked(!nextLiked);
      setLikeCount((current) => Math.max(0, current + (nextLiked ? -1 : 1)));
    }
  };

  const handleToggleComment = () => {
    setShowComposer((prev) => {
      if (prev) {
        commentInputRef.current?.blur();
        return false;
      }
      return true;
    });
  };

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentBody.trim()) return;

    try {
      await commentMutation.mutateAsync({ body: commentBody.trim() });
      setCommentBody('');
    } catch (error) {
      // ignore error UI for now; future iteration can add toast
    }
  };

  const authorInitials = getAuthorInitials(post);
  const authorLabel = getAuthorLabel(post);
  const publishedDate = getPostPublishedDate(post);

  const commentCountDisplay = Math.max(post.commentsCount, comments.length);

  useEffect(() => {
    if (!showComposer) return;
    requestAnimationFrame(() => {
      commentInputRef.current?.focus();
      commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [showComposer]);

  return (
    <article className="flex flex-col gap-5 pb-10">
      <Link href={href} className="block" prefetch>
        <div className="relative w-full overflow-hidden bg-neutral-200">
          {coverUrl ? (
            <img src={coverUrl} alt={post.title} className="w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center text-neutral-500">
              <ImageIcon size={48} />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-6 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              {authorInitials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-neutral-900">{authorLabel}</span>
              {publishedDate ? (
                <span className="text-xs text-neutral-400">{publishedDate}</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked ? 'text-red-500' : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <HeartIcon
                size={22}
                className={liked ? 'fill-current text-red-500' : 'fill-transparent text-neutral-500'}
              />
              <span>{likeCount}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleComment}
              className="flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-neutral-800"
            >
              <MessageCircleIcon size={22} />
              <span>{commentCountDisplay}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {commentsLoading ? (
            <>
              <Skeleton className="h-14 w-full rounded-lg bg-neutral-200/60" />
              <Skeleton className="h-14 w-full rounded-lg bg-neutral-200/60" />
            </>
          ) : displayedComments.length === 0 ? (
            <p className="text-sm text-neutral-400">还没有评论，来聊聊吧。</p>
          ) : (
            displayedComments.map((comment) => (
              <div key={comment.id} className="flex flex-col gap-1">
                <span className="text-xs text-neutral-400">
                  {comment.author?.display_name ?? '匿名用户'}
                </span>
                <p className="text-sm text-neutral-700">{comment.body}</p>
              </div>
            ))
          )}

          {hasMoreComments ? (
            <Link href={href} className="text-xs font-medium text-neutral-500" prefetch>
              展开
            </Link>
          ) : null}
        </div>

        {showComposer ? (
          <form onSubmit={handleSubmitComment} className="flex flex-col gap-3">
            <textarea
              ref={commentInputRef}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              rows={2}
              placeholder="写下你的想法…"
              className="w-full resize-none border-b border-neutral-200 bg-transparent pb-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentMutation.isPending || !commentBody.trim()}
                className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {commentMutation.isPending ? '发送中…' : '发布'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </article>
  );
}
