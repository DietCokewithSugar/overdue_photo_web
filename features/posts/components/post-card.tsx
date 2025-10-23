'use client';

import Link from 'next/link';
import type { Route } from 'next';

import type { PostDto } from '@/features/posts/types';
import { ImageIcon } from '@/components/icons';

const buildImageUrl = (storagePath: string) => {
  const [bucket, ...rest] = storagePath.split('/');
  const path = rest.join('/');
  const params = new URLSearchParams({ bucket, path });
  return `/api/uploads/proxy?${params.toString()}` as Route;
};

interface PostCardProps {
  post: PostDto;
}

export function PostCard({ post }: PostCardProps) {
  const href = `/posts/${post.id}` as Route;

  return (
    <Link
      href={href}
      className="flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-neutral-900"
      prefetch
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900">
        {post.images?.length ? (
          <img
            src={buildImageUrl(post.images[0].storage_path)}
            alt={post.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
            <ImageIcon size={36} />
          </div>
        )}
        {post.images?.length ? (
          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-4 py-1 text-xs text-neutral-300">
            共 {post.images.length} 张作品
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {post.is_featured && (
          <span className="inline-flex w-fit items-center rounded-full bg-brand-500/15 px-3 py-1 text-xs text-brand-300">
            精选作品
          </span>
        )}
        <h2 className="line-clamp-2 text-base font-semibold text-neutral-50">{post.title}</h2>
        {post.content_plaintext && (
          <p className="line-clamp-2 text-sm text-neutral-400">{post.content_plaintext}</p>
        )}

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>❤️ {post.likesCount}</span>
          <span>💬 {post.commentsCount}</span>
        </div>
      </div>
    </Link>
  );
}
