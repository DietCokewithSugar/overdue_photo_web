'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useSignIn, useSignOut, useSignUp } from '@/features/auth/hooks';

type AuthMode = 'sign-in' | 'sign-up';

interface AuthFormValues {
  email: string;
  password: string;
  displayName?: string;
}

const defaultValues: AuthFormValues = {
  email: '',
  password: '',
  displayName: ''
};

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<AuthFormValues>({
    defaultValues
  });

  const signUpMutation = useSignUp();
  const signInMutation = useSignIn();
  const signOutMutation = useSignOut();

  const isSubmitting =
    signUpMutation.isPending || signInMutation.isPending || signOutMutation.isPending;

  const handleSubmit = form.handleSubmit(async (values) => {
    setMessage(null);
    try {
      if (mode === 'sign-up') {
        const result = await signUpMutation.mutateAsync({
          email: values.email,
          password: values.password,
          displayName: values.displayName ?? values.email
        });

        if (result.requiresEmailConfirmation) {
          setMessage('注册成功，请查收邮箱完成验证后再登录。');
        } else {
          setMessage('注册成功，已自动登录。');
          router.push('/profile');
        }
      } else {
        await signInMutation.mutateAsync({
          email: values.email,
          password: values.password
        });
        setMessage('登录成功。');
        router.push('/profile');
      }
      form.reset(defaultValues);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('请求失败，请稍后重试。');
      }
    }
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold text-neutral-50">
          {mode === 'sign-in' ? '登录过期相册' : '注册新账号'}
        </h1>
        <p className="text-sm text-neutral-400">
          {mode === 'sign-in'
            ? '输入邮箱和密码进入你的摄影世界。'
            : '创建账户，和更多摄影爱好者分享作品。'}
        </p>
      </header>

      <div className="flex rounded-full bg-white/5 p-1 text-sm text-neutral-300">
        <button
          type="button"
          onClick={() => setMode('sign-in')}
          className={`flex-1 rounded-full px-4 py-2 ${mode === 'sign-in' ? 'bg-white text-neutral-900' : ''}`}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => setMode('sign-up')}
          className={`flex-1 rounded-full px-4 py-2 ${mode === 'sign-up' ? 'bg-white text-neutral-900' : ''}`}
        >
          注册
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm text-neutral-300">
          邮箱
          <input
            type="email"
            required
            className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none"
            {...form.register('email')}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-neutral-300">
          密码
          <input
            type="password"
            required
            minLength={8}
            className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none"
            {...form.register('password')}
          />
        </label>

        {mode === 'sign-up' && (
          <label className="flex flex-col gap-2 text-sm text-neutral-300">
            昵称
            <input
              type="text"
              placeholder="展示用昵称"
              className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none"
              {...form.register('displayName')}
            />
          </label>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === 'sign-in'
              ? '登录中…'
              : '注册中…'
            : mode === 'sign-in'
              ? '登录'
              : '注册'}
        </Button>
      </form>

      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
        <span>已登录？</span>
        <Button
          type="button"
          variant="secondary"
          disabled={signOutMutation.isPending}
          onClick={() => {
            setMessage(null);
            signOutMutation.mutate(undefined, {
              onSuccess: () => setMessage('已退出登录。'),
              onError: (error) =>
                setMessage(error instanceof Error ? error.message : '退出登录失败')
            });
          }}
        >
          退出当前账号
        </Button>
      </div>

      {message && (
        <p className="rounded-3xl bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{message}</p>
      )}
    </div>
  );
}
