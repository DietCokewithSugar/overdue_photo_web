'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { ChangeEvent, ReactNode, useRef } from 'react';

import { HomeIcon, PlusIcon, TrophyIcon, UserIcon } from '@/components/icons';
import { setPendingNewPostFiles } from '@/features/posts/state/new-post-selection';
import { useProfile } from '@/features/profile/hooks';

type NavItem = {
  label: string;
  href: Route;
  icon: typeof HomeIcon;
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: '首页', href: '/' as Route, icon: HomeIcon },
  { label: '比赛', href: '/contests' as Route, icon: TrophyIcon },
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
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const isHomePage = pathname === '/';
  const isImmersiveRoute =
    isHomePage ||
    pathname.startsWith('/posts') ||
    pathname.startsWith('/contests') ||
    pathname.startsWith('/new-post') ||
    pathname.startsWith('/profile');
  const shouldShowTopBar = showTopBar && !isImmersiveRoute;
  const shellBackground = isImmersiveRoute ? 'bg-white' : 'bg-neutral-950';
  const mainPadding = isImmersiveRoute ? 'pb-36 pt-6' : 'px-5 pb-28';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFabClick = () => {
    if (isProfileLoading) return;
    if (!profile) {
      router.push('/login');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setPendingNewPostFiles(Array.from(files));
    router.push('/new-post');
    event.target.value = '';
  };

  return (
    <div className={`relative mx-auto flex min-h-screen w-full max-w-md flex-col ${shellBackground}`}>
      {shouldShowTopBar && (
        <header className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-50">{title ?? '过期相册'}</h1>
            <p className="text-xs text-neutral-400">捕捉每一个过期的瞬间</p>
          </div>
          {topAction}
        </header>
      )}

      <main className={`flex-1 overflow-y-auto ${mainPadding}`}>{children}</main>

      <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center justify-between rounded-3xl border border-white/70 bg-white/70 px-6 py-3 shadow-lg shadow-black/10 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const baseClasses = isActive
            ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-lg shadow-neutral-900/30 transition-colors'
            : 'flex h-12 w-12 items-center justify-center rounded-2xl text-neutral-500 transition-colors hover:text-neutral-800';

          return (
            <Link key={item.href} href={item.href} className={baseClasses} prefetch aria-label={item.label}>
              <Icon size={22} />
            </Link>
          );
        })}
      </nav>

      {isHomePage ? (
        <>
          <button
            type="button"
            onClick={handleFabClick}
            aria-label="发布新作品"
            className="fixed bottom-24 right-10 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.45)] transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/30"
          >
            <PlusIcon size={28} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      ) : null}
    </div>
  );
}
