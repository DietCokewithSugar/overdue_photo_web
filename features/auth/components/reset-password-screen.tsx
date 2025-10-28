'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const client = getSupabaseBrowserClient();
      setSupabase(client);
    } catch (error) {
      console.error(error);
      setSessionError('缺少 Supabase 配置，请检查环境变量。');
      setIsPreparing(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const prepare = async () => {
      setIsPreparing(true);
      setSessionError(null);
      try {
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          if (hash.includes('access_token')) {
            const params = new URLSearchParams(hash.slice(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              if (error) throw error;
            }
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          throw new Error('重设链接已失效或已被使用');
        }

        if (typeof window !== 'undefined') {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
        }

        setIsSessionReady(true);
      } catch (error) {
        console.error(error);
        setSessionError('重设链接无效或已过期，请返回登录页重新申请。');
      } finally {
        setIsPreparing(false);
      }
    };

    void prepare();
  }, [searchParams, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage('新密码至少需要 8 位字符。');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('两次输入的密码不一致，请重新确认。');
      return;
    }

    if (!supabase) {
      setMessage('Supabase 客户端尚未就绪，请刷新页面后重试。');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      setMessage('密码已更新，请使用新密码重新登录。正在跳转…');
      setTimeout(() => router.push('/login'), 1600);
    } catch (error) {
      console.error(error);
      setMessage('密码更新失败，请稍后重试或重新申请邮件。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isPreparing) {
      return <Skeleton className="h-40 rounded-[28px] bg-neutral-900/40" />;
    }

    if (sessionError) {
      return (
        <div className="flex flex-col gap-4 rounded-[28px] border border-red-500/40 bg-red-500/10 px-5 py-6 text-sm text-red-200">
          <p>{sessionError}</p>
          <Button
            type="button"
            onClick={() => router.push('/login')}
            className="h-11 rounded-full bg-white text-neutral-950 hover:bg-neutral-200"
          >
            返回登录页
          </Button>
        </div>
      );
    }

    if (!isSessionReady) {
      return (
        <div className="flex flex-col gap-3 rounded-[28px] border border-neutral-800 bg-neutral-900/40 px-5 py-6 text-sm text-neutral-300">
          <p>正在验证重设链接，请稍候…</p>
        </div>
      );
    }

    return (
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm text-neutral-300">
          <span className="text-xs uppercase tracking-wide text-neutral-500">新密码</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none transition focus:border-neutral-600 focus:ring-0"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-neutral-300">
          <span className="text-xs uppercase tracking-wide text-neutral-500">确认新密码</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
            className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none transition focus:border-neutral-600 focus:ring-0"
          />
        </label>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 rounded-full bg-white text-neutral-950 transition hover:bg-neutral-200 disabled:bg-neutral-300 disabled:text-neutral-500"
        >
          {isSubmitting ? '更新中…' : '更新密码'}
        </Button>
      </form>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-8 rounded-[36px] border border-neutral-800 bg-neutral-950 px-6 py-10 text-neutral-100 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">Expired Album</span>
            <h1 className="text-3xl font-medium text-white">重设密码</h1>
          </div>
          <p className="text-sm leading-relaxed text-neutral-400">
            为保障账户安全，请设置一个至少 8 位的新密码，并妥善保管。
          </p>
        </header>

        {renderContent()}
      </section>

      {message ? (
        <p className="rounded-[28px] border border-neutral-700 bg-neutral-950 px-6 py-3 text-sm text-neutral-100">
          {message}
        </p>
      ) : null}
    </div>
  );
}
