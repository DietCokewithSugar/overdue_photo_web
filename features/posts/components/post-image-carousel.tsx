'use client';

import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from 'react';

import { ArrowLeftIcon, ImageIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface PostImageCarouselItem {
  url: string;
  width?: number | null;
  height?: number | null;
}

interface PostImageCarouselProps {
  images: PostImageCarouselItem[];
  alt: string;
  resetKey?: string | number | null;
  className?: string;
  aspectRatioClassName?: string;
  preferredAspectRatio?: number | null;
  imageClassName?: string;
  backgroundClassName?: string;
  imageFit?: 'cover' | 'contain';
  showNavButtons?: boolean;
  showIndicators?: boolean;
  placeholder?: ReactNode;
  onUserNavigate?: () => void;
}

const DEFAULT_BACKGROUND = 'bg-white';

export function PostImageCarousel({
  images,
  alt,
  resetKey,
  className,
  aspectRatioClassName,
  preferredAspectRatio,
  imageClassName,
  backgroundClassName,
  imageFit = 'cover',
  showNavButtons = true,
  showIndicators = true,
  placeholder,
  onUserNavigate
}: PostImageCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const lastDeltaRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const total = images.length;

  const containerAspectStyle: CSSProperties | undefined = useMemo(() => {
    if (!preferredAspectRatio || preferredAspectRatio <= 0) return undefined;
    return {
      aspectRatio: 1 / preferredAspectRatio
    };
  }, [preferredAspectRatio]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (resetKey === undefined) return;
    setActiveIndex(0);
    activeIndexRef.current = 0;
    setDragOffset(0);
    setTransitionEnabled(true);
  }, [resetKey]);

  const goToIndex = (nextIndex: number, fromUser = false) => {
    if (!total) return;
    const normalized = ((nextIndex % total) + total) % total;
    if (fromUser && normalized !== activeIndexRef.current) {
      onUserNavigate?.();
    }
    setTransitionEnabled(true);
    setDragOffset(0);
    if (normalized !== activeIndexRef.current) {
      activeIndexRef.current = normalized;
    }
    setActiveIndex(normalized);
  };

  const moveBy = (delta: number) => {
    if (!total) return;
    const nextIndex = activeIndexRef.current + delta;
    goToIndex(nextIndex, true);
  };

  const finishDrag = (deltaPx: number) => {
    if (!isDragging) return;
    const width = containerRef.current?.clientWidth ?? 1;
    const absDelta = Math.abs(deltaPx);
    const threshold = Math.max(width * 0.15, 40);
    if (total > 1 && absDelta > threshold) {
      moveBy(deltaPx < 0 ? 1 : -1);
    } else {
      setTransitionEnabled(true);
      setDragOffset(0);
    }
    setIsDragging(false);
    const pointerId = pointerIdRef.current;
    if (pointerId != null) {
      try {
        containerRef.current?.releasePointerCapture(pointerId);
      } catch {
        // ignore failures when capture is already released
      }
    }
    pointerIdRef.current = null;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (total <= 1) return;
    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    lastDeltaRef.current = 0;
    setIsDragging(true);
    setTransitionEnabled(false);
    try {
      containerRef.current?.setPointerCapture(event.pointerId);
    } catch {
      // noop
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (event.pointerId !== pointerIdRef.current) return;
    const delta = event.clientX - startXRef.current;
    lastDeltaRef.current = delta;
    const width = containerRef.current?.clientWidth ?? 1;
    if (width === 0) return;
    setDragOffset((delta / width) * 100);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (event.pointerId !== pointerIdRef.current) return;
    const delta = event.clientX - startXRef.current;
    finishDrag(delta);
  };

  const handlePointerLeave = () => {
    if (!isDragging) return;
    finishDrag(lastDeltaRef.current);
  };

  const handlePrevClick = (event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    moveBy(-1);
  };

  const handleNextClick = (event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    moveBy(1);
  };

  if (total === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          backgroundClassName ?? DEFAULT_BACKGROUND,
          aspectRatioClassName ?? 'aspect-[4/5]',
          className
        )}
        style={containerAspectStyle}
      >
        {placeholder ?? <ImageIcon size={48} className="text-neutral-500" />}
      </div>
    );
  }

  const fitClass =
    imageFit === 'contain'
      ? 'object-contain'
      : 'object-cover';

  return (
    <div className={cn('relative w-full select-none', className)}>
      <div
        ref={containerRef}
        className={cn(
          'relative w-full overflow-hidden touch-pan-y',
          backgroundClassName ?? DEFAULT_BACKGROUND,
          aspectRatioClassName,
          isDragging ? 'cursor-grabbing' : total > 1 ? 'cursor-grab' : 'cursor-default'
        )}
        style={containerAspectStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <div
          className="flex h-full w-full"
          style={{
            transform: `translate3d(${(-activeIndex * 100 + dragOffset).toFixed(4)}%, 0, 0)`,
            transition: transitionEnabled ? 'transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)' : 'none'
          }}
        >
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className={cn(
                'flex h-full w-full shrink-0 items-center justify-center',
                backgroundClassName ?? DEFAULT_BACKGROUND
              )}
            >
              <img
                src={image.url}
                alt={alt}
                className={cn(
                  'h-full w-full',
                  fitClass,
                  imageClassName
                )}
                draggable={false}
                loading="lazy"
                onDragStart={(event) => event.preventDefault()}
              />
            </div>
          ))}
        </div>

        {showNavButtons && total > 1 ? (
          <>
            <button
              type="button"
              onClick={handlePrevClick}
              className={cn(
                'absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/60 p-2 text-white transition hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-white/60',
                'sm:flex'
              )}
              aria-label="Previous image"
            >
              <ArrowLeftIcon size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleNextClick}
              className={cn(
                'absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/60 p-2 text-white transition hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-white/60',
                'sm:flex'
              )}
              aria-label="Next image"
            >
              <ArrowLeftIcon size={18} strokeWidth={2} className="rotate-180" />
            </button>
          </>
        ) : null}
      </div>

      {showIndicators && total > 1 ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 w-1.5 rounded-full bg-white/50 transition-all',
                index === activeIndex ? 'w-4 bg-white' : ''
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
