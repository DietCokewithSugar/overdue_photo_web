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
    <div className="flex flex-col gap-8 pb-32">
      <div className="px-5 py-2">
        <h2 className="text-2xl font-semibold text-neutral-900">过期相册</h2>
      </div>

      <div className="px-5">
        <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 p-1 text-sm shadow-sm backdrop-blur">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <PostsFeed filter={activeTab} />
    </div>
  );
}
