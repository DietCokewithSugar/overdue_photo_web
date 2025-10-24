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
