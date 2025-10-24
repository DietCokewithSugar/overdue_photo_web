'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

import type { ContestEntryDto } from '@/features/contests/types';
import { ImageIcon } from '@/components/icons';
import { buildStorageProxyUrl } from '@/lib/storage-path';

interface ContestEntryCardProps {
  entry: ContestEntryDto;
}

export function ContestEntryCard({ entry }: ContestEntryCardProps) {
  const viewerImages = entry.images ?? [];
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const firstImage = viewerImages[0];
  const previewPath = firstImage?.thumbnail_path ?? firstImage?.storage_path;
  const previewUrl = buildStorageProxyUrl(previewPath);

  const activeImage = viewerImages[activeIndex];
  const activeImageUrl = useMemo(
    () => buildStorageProxyUrl(activeImage?.storage_path ?? activeImage?.thumbnail_path),
    [activeImage?.storage_path, activeImage?.thumbnail_path]
  );

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setActiveIndex(0);
  }, []);

  const openViewer = useCallback(
    (index: number) => {
      if (!viewerImages.length) return;
      setActiveIndex(index);
      setViewerOpen(true);
    },
    [viewerImages.length]
  );

  const showPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length);
  }, [viewerImages.length]);

  const showNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % viewerImages.length);
  }, [viewerImages.length]);

  useEffect(() => {
    if (!viewerOpen) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeViewer();
      } else if (event.key === 'ArrowLeft' && viewerImages.length > 1) {
        event.preventDefault();
        showPrev();
      } else if (event.key === 'ArrowRight' && viewerImages.length > 1) {
        event.preventDefault();
        showNext();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = originalOverflow;
    };
  }, [viewerOpen, viewerImages.length, closeViewer, showPrev, showNext]);

  return (
    <>
      <article className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-neutral-900/60 p-4 text-sm text-neutral-200">
        <header className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-semibold text-neutral-50">{entry.title}</span>
            <span className="text-xs text-neutral-500">
              {entry.author?.display_name ?? '匿名'} · {new Date(entry.submitted_at).toLocaleDateString()}
            </span>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-400">
            {entry.entry_type === 'single' ? '单张组' : '图集组'}
          </span>
        </header>

        <button
          type="button"
          onClick={() => openViewer(0)}
          className="group relative h-40 w-full overflow-hidden rounded-2xl bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-300/60"
          aria-label={`查看作品《${entry.title}》大图`}
        >
          {previewUrl ? (
            <>
              <Image
                src={previewUrl}
                alt={entry.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(min-width: 768px) 300px, 100vw"
                priority={false}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/40 px-3 py-2 text-xs text-neutral-200">
                <ImageIcon size={18} />
                <span>{viewerImages.length} 张作品</span>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-500">
              暂无预览
            </div>
          )}
        </button>

        {entry.description && (
          <p className="text-sm text-neutral-400">{entry.description}</p>
        )}
      </article>

      {viewerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col bg-black/90"
            onClick={closeViewer}
          >
            <header
              className="flex items-start justify-between px-4 pt-4 text-sm text-neutral-200"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="max-w-[70%] truncate text-base font-medium">{entry.title}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeViewer();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-neutral-50 hover:bg-white/20"
                aria-label="关闭"
              >
                ×
              </button>
            </header>
            <div
              className="relative flex flex-1 items-center justify-center px-4 pb-6"
              onClick={(event) => event.stopPropagation()}
            >
              {viewerImages.length > 1 && (
                <button
                  type="button"
                  onClick={showPrev}
                  className="absolute left-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-neutral-100 hover:bg-white/20"
                  aria-label="上一张"
                >
                  ‹
                </button>
              )}

              {activeImageUrl ? (
                <Image
                  src={activeImageUrl}
                  alt={`${entry.title} - 第 ${activeIndex + 1} 张`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  无法加载图片
                </div>
              )}

              {viewerImages.length > 1 && (
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-neutral-100 hover:bg-white/20"
                  aria-label="下一张"
                >
                  ›
                </button>
              )}
            </div>

            {viewerImages.length > 1 && (
              <div
                className="flex items-center gap-2 overflow-x-auto px-4 pb-4"
                onClick={(event) => event.stopPropagation()}
              >
                {viewerImages.map((image, index) => {
                  const thumbUrl = buildStorageProxyUrl(image.thumbnail_path ?? image.storage_path);
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border ${
                        index === activeIndex ? 'border-white' : 'border-transparent'
                      }`}
                      aria-label={`第 ${index + 1} 张`}
                    >
                      {thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          alt={`缩略图 ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                          缺失
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
