'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { requestSignedUpload } from '@/features/uploads/api';
import { uploadToSignedUrl } from '@/features/uploads/upload';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  type ProfileDto
} from '@/features/profile/hooks';
import { ApiClientError } from '@/lib/api';
import { getPublicImageUrl } from '@/lib/storage-path';
import type { Route } from 'next';

type Feedback = {
  type: 'success' | 'error';
  text: string;
};

const getInitials = (profile: ProfileDto | null) => {
  const name = profile?.display_name?.trim();
  if (!name) return '我';
  return Array.from(name).slice(0, 2).join('').toUpperCase();
};

export function ProfileEditScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileFeedback, setProfileFeedback] = useState<Feedback | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!profile) return;

    setDisplayName(profile.display_name ?? '');
    setBio(profile.bio ?? '');
    setAvatarPath(profile.avatar_url ?? undefined);
    setAvatarPreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
  }, [profile]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const initials = getInitials(profile ?? null);
  const avatarUrl = useMemo(
    () =>
      avatarPreview ??
      getPublicImageUrl(avatarPath, { width: 240, height: 240, resize: 'cover' }) ??
      null,
    [avatarPreview, avatarPath]
  );

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarUploading(true);

    try {
      const { path, signedUrl } = await requestSignedUpload({
        resource: 'profile-avatar',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size
      });

      await uploadToSignedUrl(signedUrl, file);

      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setAvatarPath(path);
    } catch (error) {
      console.error(error);
      setAvatarError('头像上传失败，请稍后重试。');
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileFeedback(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setProfileFeedback({ type: 'error', text: '昵称不能为空。' });
      return;
    }

    const payload = {
      displayName: trimmedName,
      bio: bio.trim(),
      avatarUrl: avatarPath
    };

    try {
      await updateProfile.mutateAsync(payload);
      setProfileFeedback({ type: 'success', text: '资料已更新。' });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setProfileFeedback({ type: 'error', text: error.message });
      } else {
        setProfileFeedback({ type: 'error', text: '资料更新失败，请稍后重试。' });
      }
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', text: '新密码至少需要 8 位字符。' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: '两次输入的新密码不一致。' });
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword
      });

      setPasswordFeedback({ type: 'success', text: '密码已成功更新。' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPasswordFeedback({ type: 'error', text: error.message });
      } else {
        setPasswordFeedback({ type: 'error', text: '修改密码失败，请稍后再试。' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-5 pb-36">
        <Skeleton className="h-52 rounded-[32px]" />
        <Skeleton className="h-72 rounded-[32px]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-8 px-5 pb-36">
        <section className="space-y-5">
          <div className="flex flex-col items-center gap-4 rounded-[28px] bg-white px-6 py-10 text-center text-neutral-700 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
              游
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">未登录用户</h1>
              <p className="mt-1 text-sm text-neutral-500">登录后即可编辑个人资料与安全信息。</p>
            </div>
            <Link href={'/login' as Route} className="w-full">
              <Button className="w-full rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800">
                登录 / 注册
              </Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-5 pb-36">
      <header className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          返回
        </button>
        <h1 className="text-base font-semibold text-neutral-900">编辑个人资料</h1>
        <span className="text-sm text-transparent">返回</span>
      </header>

      <section className="flex flex-col gap-6 rounded-[32px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]">
        <h2 className="text-sm font-semibold text-neutral-900">基本信息</h2>

        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="用户头像" fill className="object-cover" sizes="112px" />
            ) : (
              <span className="text-2xl font-semibold text-neutral-500">{initials}</span>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900">
            {avatarUploading ? '上传中…' : '更新头像'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
          </label>
          {avatarError ? <p className="text-xs text-red-500">{avatarError}</p> : null}
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleProfileSubmit}>
          <label className="flex flex-col gap-2 text-sm text-neutral-600">
            昵称
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="请输入昵称"
              required
              className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-600">
            简介
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              placeholder="分享一点你的故事或风格。"
              className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
          </label>

          <Button
            type="submit"
            disabled={updateProfile.isPending || avatarUploading}
            className="rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {updateProfile.isPending ? '保存中…' : '保存资料'}
          </Button>

          {profileFeedback ? (
            <p
              className={`text-center text-xs ${
                profileFeedback.type === 'success' ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {profileFeedback.text}
            </p>
          ) : null}
        </form>
      </section>

      <section className="flex flex-col gap-6 rounded-[32px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]">
        <h2 className="text-sm font-semibold text-neutral-900">修改密码</h2>

        <form className="flex flex-col gap-5" onSubmit={handlePasswordSubmit}>
          <label className="flex flex-col gap-2 text-sm text-neutral-600">
            当前密码
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="请输入当前密码"
              minLength={8}
              required
              className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-600">
            新密码
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="至少 8 位，区分大小写"
              minLength={8}
              required
              className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-600">
            确认新密码
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入新密码"
              minLength={8}
              required
              className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
          </label>

          <Button
            type="submit"
            disabled={changePassword.isPending}
            className="rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {changePassword.isPending ? '修改中…' : '更新密码'}
          </Button>

          {passwordFeedback ? (
            <p
              className={`text-center text-xs ${
                passwordFeedback.type === 'success' ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {passwordFeedback.text}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
