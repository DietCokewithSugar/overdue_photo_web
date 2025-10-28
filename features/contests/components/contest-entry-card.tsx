'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ImageIcon } from '@/components/icons';
import type { ContestEntryDto } from '@/features/contests/types';
import { getPublicImageUrl } from '@/lib/storage-path';

interface ContestEntryCardProps {
  entry: ContestEntryDto;
}

const getInitials = (entry: ContestEntryDto) => {
  const displayName = entry.author?.display_name?.trim();
  if (displayName) {
    const chars = Array.from(displayName);
    return chars.slice(0, 2).join('').toUpperCase();
  }

  const compact = entry.author_id.replace(/-/g, '');
  return compact.slice(0, 2).toUpperCase() || 'US';
};

const getAuthorLabel = (entry: ContestEntryDto) => {
  const displayName = entry.author?.display_name?.trim();
  if (displayName) return displayName;

  const compact = entry.author_id.replace(/-/g, '');
  return `用户 ${compact.slice(0, 6) || '访客'}`;
};

export function ContestEntryCard({ entry }: ContestEntryCardProps) {
  const viewerImages = entry.images ?? [];
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const firstImage = viewerImages[0];
  const previewPath = firstImage?.thumbnail_path ?? firstImage?.storage_path;
  const previewUrl = getPublicImageUrl(previewPath, {
    width: 1000,
    height: 1200,
    resize: 'cover'
  });

  const activeImage = viewerImages[activeIndex];
  const activeImageUrl = useMemo(
    () =>
      getPublicImageUrl(activeImage?.storage_path ?? activeImage?.thumbnail_path, {
        width: 1600,
        height: 1600,
        resize: 'contain',
        quality: 90
      }),
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

  const initials = getInitials(entry);
  const displayName = getAuthorLabel(entry);

  return (
    <>
      <article className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              {initials}
            </div>
            <span className="text-sm font-medium text-neutral-900">{displayName}</span>
          </div>
        </div>

        <h3 className="px-1 text-lg font-semibold text-neutral-900">{entry.title}</h3>

        <button
          type="button"
          onClick={() => openViewer(0)}
          className="block w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/20"
          aria-label={`查看作品《${entry.title}》大图`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={entry.title}
              className="w-full bg-neutral-200 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center bg-neutral-200 text-neutral-500">
              <ImageIcon size={40} />
            </div>
          )}

        </button>
      </article>

      {viewerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={closeViewer}>
            <header
              className="flex items-start justify-between px-4 pt-4 text-sm text-white"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold">{entry.title}</span>
                <span className="text-xs text-white/70">{displayName}</span>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeViewer();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
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
                  className="absolute left-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white hover:bg-white/25"
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
                <div className="flex h-full w-full items-center justify-center text-neutral-300">
                  无法加载图片
                </div>
              )}

              {viewerImages.length > 1 && (
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white hover:bg-white/25"
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
                  const thumbUrl = getPublicImageUrl(image.thumbnail_path ?? image.storage_path, {
                    width: 160,
                    height: 160,
                    resize: 'cover'
                  });
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border ${
                        isActive ? 'border-white' : 'border-transparent'
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
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-200">
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
