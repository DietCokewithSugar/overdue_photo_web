'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon, DotsVerticalIcon, DownloadIcon, TrashIcon } from '@/components/icons';
import { usePostQuery, useDeletePostMutation } from '@/features/posts/hooks';
import { getPublicImageUrl } from '@/lib/storage-path';

interface ProfilePostDetailScreenProps {
  postId: string;
}

export function ProfilePostDetailScreen({ postId }: ProfilePostDetailScreenProps) {
  const router = useRouter();
  const { data: post, isLoading, error } = usePostQuery(postId);
  const deleteMutation = useDeletePostMutation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = () => {
    if (!post || deleteMutation.isPending) return;
    if (!window.confirm('确定要删除这条作品吗？删除后无法恢复。')) return;
    setMenuOpen(false);
    deleteMutation.mutate(postId, {
      onSuccess: () => {
        router.replace('/profile');
        router.refresh();
      }
    });
  };

  const handleDownload = () => {
    if (!post?.images?.length) return;
    const originalUrl = getPublicImageUrl(post.images[0].storage_path, {
      quality: 90
    });
    if (originalUrl) {
      window.open(originalUrl, '_blank');
    }
    setMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="p-5">
          <Skeleton className="h-64 w-full rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <p className="text-sm text-neutral-500">无法加载作品，可能已被删除。</p>
      </div>
    );
  }

  const images = post.images ?? [];

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="返回"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
        >
          <ArrowLeftIcon size={20} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="更多操作"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          >
            <DotsVerticalIcon size={20} />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-neutral-200 bg-white p-2 text-sm text-neutral-700 shadow-xl">
              <button
                type="button"
                onClick={handleDownload}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-neutral-100"
              >
                <DownloadIcon size={18} /> 下载原图
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TrashIcon size={18} /> {deleteMutation.isPending ? '删除中…' : '删除作品'}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5 pb-16">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-900">{post.title}</h1>
          <p className="text-xs text-neutral-400">
            ❤️ {post.likesCount} · 💬 {post.commentsCount}
          </p>
          {post.content_plaintext ? (
            <p className="text-sm text-neutral-500">{post.content_plaintext}</p>
          ) : null}
        </div>

        <div className="space-y-6">
          {images.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-[28px] bg-neutral-100 text-sm text-neutral-500">
              暂无图片
            </div>
          ) : (
            images.map((image) => {
              const imageUrl = getPublicImageUrl(image.storage_path, {
                quality: 90
              });
              return imageUrl ? (
                <img
                  key={image.id}
                  src={imageUrl}
                  alt={post.title}
                  className="w-full rounded-[28px] bg-neutral-100 object-cover"
                  loading="lazy"
                />
              ) : null;
            })
          )}
        </div>
      </main>
    </div>
  );
}
