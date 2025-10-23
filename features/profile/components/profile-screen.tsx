'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

import { Button } from '@/components/ui/button';
import { useProfile } from '@/features/profile/hooks';
import { useSignOut } from '@/features/auth/hooks';

export function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const signOutMutation = useSignOut();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-24">
        <div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-neutral-400">
          加载中…
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-6 pb-24">
        <header className="flex flex-col items-center gap-3 rounded-3xl bg-white/5 px-6 py-8 text-center text-neutral-100">
          <div className="h-16 w-16 rounded-full border border-white/20 bg-white/10" />
          <div>
            <h1 className="text-lg font-semibold">未登录用户</h1>
            <p className="text-sm text-neutral-400">登录后浏览我的帖子、比赛投稿与收藏。</p>
          </div>
          <Link href={'/login' as Route} className="w-full">
            <Button variant="secondary" className="w-full">
              登录 / 注册
            </Button>
          </Link>
        </header>

        <section className="rounded-3xl border border-white/5 p-4">
          <h2 className="text-lg font-semibold text-neutral-100">我的帖子</h2>
          <p className="mt-2 text-sm text-neutral-500">登录后可快速查看与管理自己发布的作品。</p>
        </section>

        <section className="rounded-3xl border border-white/5 p-4">
          <h2 className="text-lg font-semibold text-neutral-100">比赛投稿</h2>
          <p className="mt-2 text-sm text-neutral-500">在此管理你参与比赛的作品，查看审核状态。</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col items-center gap-3 rounded-3xl bg-white/5 px-6 py-8 text-center text-neutral-100">
        <div className="h-16 w-16 rounded-full border border-white/20 bg-white/10" />
        <div>
          <h1 className="text-lg font-semibold">{profile.display_name}</h1>
          <p className="text-sm text-neutral-400">
            {profile.bio ?? '欢迎继续完善个人资料。'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            角色：{profile.role === 'admin' ? '管理员' : '普通用户'}
          </p>
        </div>
        <Button
          variant="secondary"
          className="w-full"
          disabled={signOutMutation.isPending}
          onClick={() =>
            signOutMutation.mutate(undefined, {
              onSuccess: () => router.push('/login')
            })
          }
        >
          {signOutMutation.isPending ? '退出中…' : '退出登录'}
        </Button>
      </header>

      <section className="rounded-3xl border border-white/5 p-4">
        <h2 className="text-lg font-semibold text-neutral-100">我的帖子</h2>
        <p className="mt-2 text-sm text-neutral-500">
          在未来版本中，你可以在这里快速管理自己的帖子。
        </p>
      </section>

      <section className="rounded-3xl border border-white/5 p-4">
        <h2 className="text-lg font-semibold text-neutral-100">比赛投稿</h2>
        <p className="mt-2 text-sm text-neutral-500">
          即将支持查看投稿状态、编辑或撤回参赛作品。
        </p>
      </section>
    </div>
  );
}
