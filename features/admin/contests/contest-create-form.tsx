'use client';

import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';

import { useCreateContest } from './hooks';

export function ContestCreateForm() {
  const createMutation = useCreateContest();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [singleLimit, setSingleLimit] = useState(5);
  const [collectionLimit, setCollectionLimit] = useState(3);
  const [fileSize, setFileSize] = useState(20);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        submissionStartsAt: new Date(start).toISOString(),
        submissionEndsAt: new Date(end).toISOString(),
        posterPath: '',
        status: 'draft',
        singleSubmissionLimit: singleLimit,
        collectionSubmissionLimit: collectionLimit,
        singleFileSizeLimitMb: fileSize
      });

      setTitle('');
      setSlug('');
      setDescription('');
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

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? '创建中…' : '创建比赛草稿'}
        </Button>
        {message && <p className="text-xs text-neutral-400">{message}</p>}
      </div>
    </form>
  );
}
