'use client';

import { ChangeEvent, FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { requestSignedUpload } from '@/features/uploads/api';
import { uploadToSignedUrl } from '@/features/uploads/upload';

import { useCreateContest } from './hooks';

type LocalPoster = {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  storagePath?: string;
};

export function ContestCreateForm() {
  const createMutation = useCreateContest();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState<LocalPoster | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [singleLimit, setSingleLimit] = useState(5);
  const [collectionLimit, setCollectionLimit] = useState(3);
  const [fileSize, setFileSize] = useState(20);
  const [message, setMessage] = useState<string | null>(null);
  const [posterError, setPosterError] = useState<string | null>(null);

  const handlePosterChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    const imageCompression = (await import('browser-image-compression')).default;
    const file = fileList[0];

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1920,
        maxSizeMB: 4,
        useWebWorker: true
      });

      if (poster?.previewUrl) {
        URL.revokeObjectURL(poster.previewUrl);
      }

      setPoster({
        id: crypto.randomUUID(),
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
        status: 'pending'
      });
      setPosterError(null);
    } catch (error) {
      console.error(error);
      setPosterError('海报处理失败，请换一张图片重试。');
    } finally {
      event.target.value = '';
    }
  };

  const removePoster = () => {
    if (poster?.previewUrl) {
      URL.revokeObjectURL(poster.previewUrl);
    }
    setPoster(null);
    setPosterError(null);
  };

  const uploadPoster = async () => {
    if (!poster) return undefined;
    if (poster.status === 'uploaded') return poster.storagePath;

    setPoster((prev) => (prev ? { ...prev, status: 'uploading' } : prev));

    const { path, signedUrl } = await requestSignedUpload({
      resource: 'contest-poster',
      fileName: poster.file.name,
      contentType: poster.file.type,
      fileSize: poster.file.size
    });

    await uploadToSignedUrl(signedUrl, poster.file);

    setPoster((prev) => (prev ? { ...prev, status: 'uploaded', storagePath: path } : prev));
    return path;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setPosterError(null);

    try {
      const trimmedDescription = description.trim();
      const posterPath = await uploadPoster();

      await createMutation.mutateAsync({
        title: title.trim(),
        slug: slug.trim(),
        description: trimmedDescription ? trimmedDescription : undefined,
        submissionStartsAt: new Date(start).toISOString(),
        submissionEndsAt: new Date(end).toISOString(),
        posterPath,
        status: 'draft',
        singleSubmissionLimit: singleLimit,
        collectionSubmissionLimit: collectionLimit,
        singleFileSizeLimitMb: fileSize
      });

      if (poster?.previewUrl) {
        URL.revokeObjectURL(poster.previewUrl);
      }

      setTitle('');
      setSlug('');
      setDescription('');
      setPoster(null);
      setStart('');
      setEnd('');
      setSingleLimit(5);
      setCollectionLimit(3);
      setFileSize(20);
      setMessage('比赛创建成功，已保存为草稿。');
    } catch (error) {
      console.error(error);
      setMessage('创建比赛失败，请稍后重试。');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-white/5 bg-neutral-900/60 p-6 text-sm">
      <div className="grid gap-2">
        <label className="text-neutral-300">
          比赛名称
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-1 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm text-neutral-50 outline-none"
            placeholder="2025夏季光影"
          />
        </label>
      </div>

      <div className="grid gap-2">
        <label className="text-neutral-300">
          Slug
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            required
            className="mt-1 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm text-neutral-50 outline-none"
            placeholder="2025-summer-light"
          />
        </label>
      </div>

      <div className="grid gap-2">
        <label className="text-neutral-300">
          比赛说明
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm text-neutral-50 outline-none"
            placeholder="填写规则、奖项等信息"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-neutral-300">
          投稿开始时间
          <input
            type="datetime-local"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            required
            className="mt-1 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm text-neutral-50 outline-none"
          />
        </label>
        <label className="text-neutral-300">
          投稿结束时间
          <input
            type="datetime-local"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            required
            className="mt-1 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm text-neutral-50 outline-none"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-neutral-300">
          单张投稿上限
          <input
            type="number"
            min={0}
            value={singleLimit}
            onChange={(event) => setSingleLimit(Number(event.target.value))}
            className="mt-1 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm text-neutral-50 outline-none"
          />
        </label>
        <label className="text-neutral-300">
          图集投稿上限
          <input
            type="number"
            min={0}
            value={collectionLimit}
            onChange={(event) => setCollectionLimit(Number(event.target.value))}
            className="mt-1 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm text-neutral-50 outline-none"
          />
        </label>
        <label className="text-neutral-300">
          单张文件上限 (MB)
          <input
            type="number"
            min={1}
            value={fileSize}
            onChange={(event) => setFileSize(Number(event.target.value))}
            className="mt-1 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm text-neutral-50 outline-none"
          />
        </label>
      </div>

      <section className="flex flex-col gap-3 rounded-3xl border border-white/5 p-4">
        <div className="flex items-center justify-between text-sm text-neutral-300">
          <span>比赛海报（可选）</span>
          {poster && (
            <button
              type="button"
              className="text-xs text-red-300"
              onClick={removePoster}
            >
              移除
            </button>
          )}
        </div>

        <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-neutral-900 text-sm text-neutral-400">
          点击或拖拽海报图片
          <input type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
        </label>

        {poster && (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img src={poster.previewUrl} alt="海报预览" className="h-48 w-full object-cover" />
            <p className="px-3 py-2 text-xs text-neutral-400">
              {poster.status === 'uploading'
                ? '上传中…'
                : poster.status === 'error'
                  ? '上传失败'
                  : '已选择海报'}
            </p>
          </div>
        )}

        {posterError && <p className="text-xs text-red-300">{posterError}</p>}
      </section>

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? '创建中…' : '创建比赛草稿'}
        </Button>
        {message && <p className="text-xs text-neutral-400">{message}</p>}
      </div>
    </form>
  );
}
