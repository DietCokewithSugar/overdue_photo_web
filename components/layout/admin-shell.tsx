'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { label: '控制台', href: '/admin' },
  { label: '帖子管理', href: '/admin/posts' },
  { label: '评论管理', href: '/admin/comments' },
  { label: '比赛管理', href: '/admin/contests' },
  { label: '用户管理', href: '/admin/users' }
] as const satisfies ReadonlyArray<{ label: string; href: string }>;

interface AdminShellProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminShell({
  title = '管理后台',
  description = '维护社区秩序，管理作品与比赛',
  actions,
  children
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-neutral-950">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-50">{title}</h1>
          <p className="text-sm text-neutral-400">{description}</p>
        </div>
        <div className="flex items-center gap-3">{actions}</div>
      </header>

      <nav className="flex items-center gap-2 border-b border-white/5 px-6 py-3 text-sm text-neutral-400">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition-colors ${
                isActive ? 'bg-white text-neutral-900' : 'hover:text-neutral-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>

      <footer className="border-t border-white/5 px-6 py-4 text-xs text-neutral-500">
        过期相册 • 管理后台
        <Button variant="ghost" className="ml-3 h-8 px-3 text-xs text-neutral-400">
          退出
        </Button>
      </footer>
    </div>
  );
}
