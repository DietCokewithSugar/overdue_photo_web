'use client';

import { useState } from 'react';

import { PostsFeed } from './posts-feed';

const TABS = [
  { label: '最新', value: 'latest' },
  { label: '精选', value: 'featured' }
] as const;

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['value']>('latest');

  return (
    <div className="flex flex-col gap-6 pb-20">
      <section className="rounded-3xl bg-gradient-to-br from-brand-400/20 to-brand-600/10 p-5">
        <h2 className="text-xl font-semibold text-neutral-50">过期的光影，有它的温度</h2>
        <p className="mt-2 text-sm text-neutral-200">
          分享你的摄影作品，参与比赛，与热爱影像的朋友们相遇。
        </p>
      </section>

      <div className="flex items-center gap-2 rounded-full bg-white/5 p-1 text-sm">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 rounded-full px-4 py-2 ${
                isActive ? 'bg-white text-neutral-900' : 'text-neutral-400'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <PostsFeed filter={activeTab} />
    </div>
  );
}
