'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { HeartIcon, MessageCircleIcon } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommentsQuery, useCreateComment } from '@/features/comments/hooks';
import {
  useLikeMutation,
  usePostQuery,
  useUnlikeMutation
} from '@/features/posts/hooks';
import {
  getAuthorInitials,
  getAuthorLabel,
  getPostPublishedDate
} from '@/features/posts/utils';
import { getPublicImageUrl } from '@/lib/storage-path';
import { PostImageCarousel, type PostImageCarouselItem } from './post-image-carousel';

interface PostDetailScreenProps {
  postId: string;
}

export function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const { data: post, isLoading, error } = usePostQuery(postId);
  const likeMutation = useLikeMutation(postId);
  const unlikeMutation = useUnlikeMutation(postId);
  const {
    data: commentsData,
    isLoading: commentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useCommentsQuery(postId);
  const commentMutation = useCreateComment(postId);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!post) return;
    setLikeCount(post.likesCount);
  }, [post]);

  useEffect(() => {
    if (!commentsData) return;
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [commentsData, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const comments = useMemo(
    () => commentsData?.pages.flatMap((page) => page.items) ?? [],
    [commentsData]
  );

  const carouselImages = useMemo<PostImageCarouselItem[]>(() => {
    const images = post?.images ?? [];
    if (images.length === 0) return [];
    return images.reduce<PostImageCarouselItem[]>((accumulator, image) => {
      const url = getPublicImageUrl(image.storage_path, {
        width: 1600,
        height: 1600,
        resize: 'contain',
        quality: 90
      });
      if (!url) return accumulator;
      accumulator.push({
        url,
        width: image.width ?? null,
        height: image.height ?? null
      });
      return accumulator;
    }, []);
  }, [post?.images]);
  const preferredAspectRatio = useMemo(() => {
    const ratios = carouselImages
      .map((image) => {
        if (!image.width || !image.height) return null;
        if (image.width <= 0 || image.height <= 0) return null;
        return image.height / image.width;
      })
      .filter((ratio): ratio is number => ratio != null);
    if (ratios.length === 0) {
      return carouselImages.length > 0 ? 4 / 5 : null;
    }
    return Math.max(...ratios);
  }, [carouselImages]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-36">
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
        无法加载帖子，可能已被删除。
      </div>
    );
  }

  const authorInitials = getAuthorInitials(post);
  const authorLabel = getAuthorLabel(post);
  const publishedDate = getPostPublishedDate(post);
  const displayedLikeCount = likeCount ?? post.likesCount;
  const commentCountDisplay = comments.length || post.commentsCount || 0;
  const handleToggleLike = async () => {
    if (likeMutation.isPending || unlikeMutation.isPending) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((current) => {
      const base = current ?? post.likesCount;
      return Math.max(0, base + (nextLiked ? 1 : -1));
    });

    try {
      const result = nextLiked
        ? await likeMutation.mutateAsync()
        : await unlikeMutation.mutateAsync();
      setLikeCount(result.likesCount);
    } catch (_error) {
      setLiked(!nextLiked);
      setLikeCount((current) => {
        const base = current ?? post.likesCount;
        return Math.max(0, base + (nextLiked ? -1 : 1));
      });
    }
  };

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentBody.trim()) return;

    try {
      await commentMutation.mutateAsync({ body: commentBody.trim() });
      setCommentBody('');
      commentInputRef.current?.blur();
    } catch (_error) {
      // ignore for now
    }
  };

  const handleScrollToComposer = () => {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex flex-col gap-8 pb-36">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start rounded-full bg-white/70 px-4 py-2 text-xs font-medium text-neutral-600 shadow-sm backdrop-blur transition hover:bg-white"
      >
        ← 返回
      </button>

      <PostImageCarousel
        images={carouselImages}
        alt={post.title}
        resetKey={post?.id}
        className="rounded-3xl"
        preferredAspectRatio={preferredAspectRatio ?? undefined}
        backgroundClassName="bg-white"
        imageFit="contain"
        showNavButtons={false}
        placeholder={<div className="h-64 w-full bg-white" />}
      />

      <div className="flex flex-col gap-8 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              {authorInitials}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-900">{authorLabel}</span>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                {publishedDate ? <span>{publishedDate}</span> : null}
                {post.is_featured ? (
                  <span className="rounded-full bg-neutral-900/5 px-2 py-1 text-[10px] text-neutral-600">
                    精选
                  </span>
                ) : null}
              </div>
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
              <span>{displayedLikeCount}</span>
            </button>

            <button
              type="button"
              onClick={handleScrollToComposer}
              className="flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-neutral-800"
            >
              <MessageCircleIcon size={22} />
              <span>{commentCountDisplay}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold text-neutral-900">{post.title}</h1>
          {post.content_plaintext ? (
            <p className="text-sm leading-relaxed text-neutral-600">{post.content_plaintext}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-neutral-900">全部评论 · {commentCountDisplay}</h2>

          {commentsLoading && comments.length === 0 ? (
            <>
              <Skeleton className="h-16 w-full rounded-2xl bg-neutral-200/60" />
              <Skeleton className="h-16 w-full rounded-2xl bg-neutral-200/60" />
            </>
          ) : comments.length === 0 ? (
            <p className="text-sm text-neutral-400">还没有评论，来聊聊吧～</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex flex-col gap-1 rounded-2xl bg-neutral-100 px-4 py-3">
                <span className="text-xs text-neutral-500">
                  {comment.author?.display_name ?? '匿名用户'}
                </span>
                <p className="text-sm text-neutral-800">{comment.body}</p>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleSubmitComment}
          className="flex flex-col gap-3 rounded-2xl bg-neutral-100/80 p-4"
        >
          <textarea
            ref={commentInputRef}
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            rows={3}
            placeholder="写下你的想法..."
            className="w-full resize-none bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={commentMutation.isPending || !commentBody.trim()}
              className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {commentMutation.isPending ? '发送中...' : '发布'}
            </button>
          </div>
        </form>

        <div className="rounded-2xl bg-neutral-100/60 px-4 py-3 text-xs text-neutral-500">
          想要投稿更多作品？前往{' '}
          <Link href="/contests" className="text-neutral-700 underline">
            比赛专区
          </Link>
          ～
        </div>
      </div>
    </div>
  );
}
