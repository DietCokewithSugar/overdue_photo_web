'use client';

import type { ContestEntryDto } from '@/features/contests/types';
import { ImageIcon } from '@/components/icons';

interface ContestEntryCardProps {
  entry: ContestEntryDto;
}

export function ContestEntryCard({ entry }: ContestEntryCardProps) {
  const firstImage = entry.images?.[0];

  return (
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

      <div className="h-40 w-full overflow-hidden rounded-2xl bg-neutral-800">
        {firstImage ? (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            <ImageIcon size={32} />
            <span className="ml-2 text-xs">{entry.images.length} 张作品</span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-500">
            暂无预览
          </div>
        )}
      </div>

      {entry.description && (
        <p className="text-sm text-neutral-400">{entry.description}</p>
      )}
    </article>
  );
}
