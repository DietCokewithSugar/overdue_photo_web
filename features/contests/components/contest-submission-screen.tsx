'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useContestQuery, useSubmitContestEntry } from '@/features/contests/hooks';
import { requestSignedUpload } from '@/features/uploads/api';
import { uploadToSignedUrl } from '@/features/uploads/upload';

type EntryType = 'single' | 'collection';

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
  storagePath?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

interface ContestSubmissionScreenProps {
  contestId: string;
}

export function ContestSubmissionScreen({ contestId }: ContestSubmissionScreenProps) {
  const router = useRouter();
  const { data: contest, isLoading, error } = useContestQuery(contestId);
  const submitEntry = useSubmitContestEntry(contestId);

  const [entryType, setEntryType] = useState<EntryType>('single');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const limit = entryType === 'single' ? 1 : 9;
  const minRequired = entryType === 'single' ? 1 : 2;

  useEffect(() => {
    if (entryType === 'single' && images.length > 1) {
      setImages((prev) => prev.slice(0, 1));
    }
  }, [entryType, images.length]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    const imageCompression = (await import('browser-image-compression')).default;

    const files = Array.from(fileList).slice(0, limit - images.length);
    const tasks = files.map(async (file) => {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 2500,
        maxSizeMB: contest?.single_file_size_limit_mb ?? 10,
        useWebWorker: true
      });

      return {
        id: crypto.randomUUID(),
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
        status: 'pending' as const
      } satisfies LocalImage;
    });

    const items = await Promise.all(tasks);
    setImages((prev) => [...prev, ...items]);
    event.target.value = '';
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const totalSize = useMemo(
    () => images.reduce((acc, image) => acc + image.file.size, 0) / 1024 / 1024,
    [images]
  );

  const uploadImages = async () => {
    const uploaded: LocalImage[] = [];

    for (const image of images) {
      setImages((prev) =>
        prev.map((item) =>
          item.id === image.id ? { ...item, status: 'uploading' as const } : item
        )
      );

      try {
        const { path, signedUrl } = await requestSignedUpload({
          resource: 'contest-entry',
          fileName: image.file.name,
          contentType: image.file.type,
          fileSize: image.file.size
        });

        await uploadToSignedUrl(signedUrl, image.file);
        const next: LocalImage = { ...image, status: 'uploaded', storagePath: path };
        uploaded.push(next);
        setImages((prev) =>
          prev.map((item) => (item.id === image.id ? next : item))
        );
      } catch (err) {
        console.error(err);
        setImages((prev) =>
          prev.map((item) =>
            item.id === image.id ? { ...item, status: 'error' as const } : item
          )
        );
        throw err;
      }
    }

    return uploaded;
  };

  const canSubmit =
    title.trim().length > 0 &&
    images.length >= minRequired &&
    (entryType === 'single' || description.trim().length > 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setMessage(null);
      const uploaded = await uploadImages();

      await submitEntry.mutateAsync({
        entryType,
        title: title.trim(),
        description: description.trim(),
        images: uploaded.map((image, index) => ({
          storagePath: image.storagePath!,
          sortOrder: index
        }))
      });

      setMessage('投稿成功');
      setTimeout(() => {
        router.replace(`/contests/${contestId}`);
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(err);
      setMessage('投稿失败，请稍后重试。');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (error || !contest) {
    return (
      <div className="rounded-3xl bg-red-500/10 p-4 text-sm text-red-300">
        无法加载比赛信息。
      </div>
    );
  }

  const now = new Date();
  const start = new Date(contest.submission_starts_at);
  const end = new Date(contest.submission_ends_at);
  const isWindowOpen = now >= start && now <= end;

  return (
    <form className="flex flex-col gap-6 pb-24" onSubmit={handleSubmit}>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-50">投稿：{contest.title}</h1>
        <p className="text-sm text-neutral-400">
          最多上传 {limit} 张图片，已选择 {images.length} 张（{totalSize.toFixed(2)} MB）。
        </p>
      </header>

      <div className="flex gap-2 rounded-full bg-white/5 p-1 text-sm text-neutral-300">
        <button
          type="button"
          onClick={() => setEntryType('single')}
          className={`flex-1 rounded-full px-4 py-2 ${
            entryType === 'single' ? 'bg-white text-neutral-900' : ''
          }`}
        >
          单张组
        </button>
        <button
          type="button"
          onClick={() => setEntryType('collection')}
          className={`flex-1 rounded-full px-4 py-2 ${
            entryType === 'collection' ? 'bg-white text-neutral-900' : ''
          }`}
        >
          图集组
        </button>
      </div>

      <label className="flex flex-col gap-2 text-sm text-neutral-300">
        作品标题
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none"
          placeholder="你的作品名"
          required
        />
      </label>

      {entryType === 'collection' && (
        <label className="flex flex-col gap-2 text-sm text-neutral-300">
          图集描述
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none"
            placeholder="介绍你的图集故事、拍摄地点与灵感"
            required
          />
        </label>
      )}

      <section className="flex flex-col gap-3 rounded-3xl border border-white/5 p-4">
        <div className="flex items-center justify-between text-sm text-neutral-300">
          <span>上传作品（{images.length}/{limit}）</span>
          <span className="text-xs text-neutral-500">单张 ≤ {contest.single_file_size_limit_mb}MB</span>
        </div>

        <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-neutral-900 text-sm text-neutral-400">
          点击或拖拽图片到此处
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative overflow-hidden rounded-2xl">
              <img src={image.previewUrl} alt="预览" className="h-28 w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1 text-xs text-neutral-200">
                <span>{(image.file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button type="button" className="text-red-300" onClick={() => handleRemove(image.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-3">
        <Button type="submit" disabled={!isWindowOpen || !canSubmit || submitEntry.isPending}>
          {submitEntry.isPending ? '提交中…' : isWindowOpen ? '提交作品' : '不在投稿时间内'}
        </Button>
        {message && <p className="text-center text-xs text-neutral-400">{message}</p>}
      </footer>
    </form>
  );
}
