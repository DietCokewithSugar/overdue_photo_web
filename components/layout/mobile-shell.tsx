'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

import { HomeIcon, PlusIcon, TrophyIcon, UserIcon } from '@/components/icons';

type NavItem = {
  label: string;
  href: Route;
  icon: typeof HomeIcon;
  isPrimary?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: '首页', href: '/' as Route, icon: HomeIcon },
  { label: '比赛', href: '/contests' as Route, icon: TrophyIcon },
  { label: '发布', href: '/new-post' as Route, icon: PlusIcon, isPrimary: true },
  { label: '我的', href: '/profile' as Route, icon: UserIcon }
];

interface MobileShellProps {
  children: ReactNode;
  showTopBar?: boolean;
  title?: string;
  topAction?: ReactNode;
}

export function MobileShell({ children, title, topAction, showTopBar = true }: MobileShellProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-neutral-950">
      {showTopBar && (
        <header className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-50">{title ?? '过期相册'}</h1>
            <p className="text-xs text-neutral-400">捕捉每一个过期的瞬间</p>
          </div>
          {topAction}
        </header>
      )}

      <main className="flex-1 overflow-y-auto px-5 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto flex w-full max-w-md items-center justify-around border-t border-white/5 bg-black/80 px-6 py-3 backdrop-blur-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const baseClasses = item.isPrimary
            ? 'flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-neutral-50 shadow-lg shadow-brand-500/30'
            : 'flex flex-col items-center text-xs';

          return (
            <Link key={item.href} href={item.href} className={baseClasses} prefetch>
              <Icon size={item.isPrimary ? 24 : 22} className={isActive ? 'text-brand-400' : ''} />
              {!item.isPrimary && (
                <span className={`mt-1 ${isActive ? 'text-brand-400' : 'text-neutral-400'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
