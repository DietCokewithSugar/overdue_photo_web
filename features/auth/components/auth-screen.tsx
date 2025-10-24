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
  confirmPassword?: string;
  displayName?: string;
}

const defaultValues: AuthFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
  displayName: ''
};

interface AuthScreenProps {
  showAccountActions?: boolean;
}

export function AuthScreen({ showAccountActions = true }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const isSignIn = mode === 'sign-in';
  const headline = isSignIn ? '欢迎回来' : '注册新账号';
  const subHeadline = isSignIn
    ? '使用你的邮箱和密码进入过期相册。'
    : '创建账户，开始与朋友分享你的光影故事。';

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
        if (values.password !== values.confirmPassword) {
          setMessage('两次输入的密码不一致，请重新确认。');
          form.setError('confirmPassword', { type: 'validate', message: '两次输入的密码不一致。' });
          return;
        }

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
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-8 rounded-[36px] border border-neutral-800 bg-neutral-950 px-6 py-10 text-neutral-100 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">Expired Album</span>
            <h1 className="text-3xl font-medium text-white">{headline}</h1>
          </div>
          <p className="text-sm leading-relaxed text-neutral-400">{subHeadline}</p>
        </header>

        <div className="flex items-center rounded-full border border-neutral-800 bg-neutral-900/80 p-1 text-sm text-neutral-400">
          <button
            type="button"
            onClick={() => setMode('sign-in')}
            className={`flex-1 rounded-full px-4 py-2 font-medium transition ${
              isSignIn ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(0,0,0,0.35)]' : 'hover:text-neutral-200'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('sign-up')}
            className={`flex-1 rounded-full px-4 py-2 font-medium transition ${
              !isSignIn ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(0,0,0,0.35)]' : 'hover:text-neutral-200'
            }`}
          >
            注册
          </button>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm text-neutral-300">
            <span className="text-xs uppercase tracking-wide text-neutral-500">邮箱</span>
            <input
              type="email"
              required
              className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none transition focus:border-neutral-600 focus:ring-0"
              {...form.register('email')}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-neutral-300">
            <span className="text-xs uppercase tracking-wide text-neutral-500">密码</span>
            <input
              type="password"
              required
              minLength={8}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none transition focus:border-neutral-600 focus:ring-0"
              {...form.register('password')}
            />
          </label>

          {!isSignIn && (
            <label className="flex flex-col gap-2 text-sm text-neutral-300">
              <span className="text-xs uppercase tracking-wide text-neutral-500">确认密码</span>
              <input
                type="password"
                required
                minLength={8}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none transition focus:border-neutral-600 focus:ring-0"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword ? (
                <span className="text-xs text-red-400">
                  {form.formState.errors.confirmPassword.message ?? '请再次输入相同的密码。'}
                </span>
              ) : null}
            </label>
          )}

          {!isSignIn && (
            <label className="flex flex-col gap-2 text-sm text-neutral-300">
              <span className="text-xs uppercase tracking-wide text-neutral-500">昵称</span>
              <input
                type="text"
                placeholder="展示用昵称"
                className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none transition placeholder:text-neutral-500 focus:border-neutral-600 focus:ring-0"
                {...form.register('displayName')}
              />
            </label>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-full bg-white text-neutral-950 transition hover:bg-neutral-200 disabled:bg-neutral-300 disabled:text-neutral-500"
          >
            {isSubmitting ? (isSignIn ? '登录中…' : '注册中…') : isSignIn ? '登录' : '注册'}
          </Button>
        </form>
      </section>

      {showAccountActions ? (
        <section className="flex flex-col gap-4 rounded-[28px] border border-neutral-800 bg-neutral-950/90 px-6 py-6 text-sm text-neutral-400 backdrop-blur">
          <span className="font-medium text-neutral-100">已登录其他账号？</span>
          <button
            type="button"
            className="self-start rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:text-white"
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
            {signOutMutation.isPending ? '退出中…' : '退出当前账号'}
          </button>

          <p className="text-xs text-neutral-500">如需切换账户，可先退出并使用新的邮箱登录。</p>
        </section>
      ) : null}

      {message ? (
        <p className="rounded-[28px] border border-neutral-700 bg-neutral-950 px-6 py-3 text-sm text-neutral-100">
          {message}
        </p>
      ) : null}
    </div>
  );
}
