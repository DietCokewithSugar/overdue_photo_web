'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { requestSignedUpload } from '@/features/uploads/api';
import { uploadToSignedUrl } from '@/features/uploads/upload';
import { useCreatePostMutation } from '@/features/posts/hooks';

type LocalImage = {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  storagePath?: string;
};

type Step = 'editor' | 'review' | 'success';

export function NewPostScreen() {
  const [step, setStep] = useState<Step>('editor');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createPost = useCreatePostMutation();
  const isReadyToPublish = title.trim().length > 0 && images.length > 0;

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    const imageCompression = (await import('browser-image-compression')).default;

    const tasks = Array.from(fileList).map(async (file) => {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 2048,
        maxSizeMB: 4,
        useWebWorker: true
      });

      return {
        id: crypto.randomUUID(),
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
        status: 'pending' as const
      } satisfies LocalImage;
    });

    const results = await Promise.all(tasks);
    setImages((prev) => [...prev, ...results]);
    event.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((image) => image.id !== id);
    });
  };

  const uploadImages = async () => {
    const uploaded: LocalImage[] = [];

    for (const image of images) {
      setImages((prev) =>
        prev.map((item) => (item.id === image.id ? { ...item, status: 'uploading' } : item))
      );

      try {
        const { path, signedUrl } = await requestSignedUpload({
          resource: 'post-image',
          fileName: image.file.name,
          contentType: image.file.type,
          fileSize: image.file.size
        });

        await uploadToSignedUrl(signedUrl, image.file);

        const next = { ...image, status: 'uploaded', storagePath: path } as LocalImage;
        uploaded.push(next);
        setImages((prev) =>
          prev.map((item) => (item.id === image.id ? next : item))
        );
      } catch (error) {
        console.error(error);
        setImages((prev) =>
          prev.map((item) => (item.id === image.id ? { ...item, status: 'error' } : item))
        );
        throw error;
      }
    }

    return uploaded;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReadyToPublish) return;

    try {
      setErrorMessage(null);
      const uploadedImages = await uploadImages();

      await createPost.mutateAsync({
        title: title.trim(),
        contentPlaintext: description.trim(),
        status: 'published',
        images: uploadedImages.map((image, index) => ({
          storagePath: image.storagePath!,
          sortOrder: index
        }))
      });

      setStep('success');
    } catch (error) {
      console.error(error);
      setErrorMessage('发布失败，请检查网络后重试。');
    }
  };

  const resetForm = () => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setTitle('');
    setDescription('');
    setImages([]);
    setStep('editor');
  };

  const totalSize = useMemo(
    () =>
      images.reduce((acc, image) => acc + image.file.size, 0) /
      1024 /
      1024,
    [images]
  );

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand-500/10 p-8 text-center text-neutral-100">
        <h1 className="text-2xl font-semibold">发布成功！</h1>
        <p className="text-sm text-neutral-200">你的过期相册已经上线啦～</p>
        <Button onClick={resetForm}>继续发布</Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6 pb-24" onSubmit={handleSubmit}>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-50">发布新作品</h1>
        <p className="text-sm text-neutral-400">
          支持多张照片，系统将在上传前自动压缩。
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-white/5 p-4">
        <label className="flex flex-col gap-2 text-sm text-neutral-300">
          作品标题
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="给作品取个醒目的标题"
            className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-300">
          作品描述（可选）
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="分享创作背后的故事、拍摄参数或灵感。"
            className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-50 outline-none"
          />
        </label>
      </div>

      <section className="flex flex-col gap-3 rounded-3xl border border-white/5 p-4">
        <div className="flex items-center justify-between text-sm text-neutral-300">
          <span>作品图片（支持多张）</span>
          <span className="text-xs text-neutral-500">合计 {totalSize.toFixed(2)} MB</span>
        </div>

        <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-neutral-900 text-sm text-neutral-400">
          点击或拖拽图片到此处
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative overflow-hidden rounded-2xl bg-neutral-900">
              <img src={image.previewUrl} alt="预览" className="h-32 w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1 text-xs text-neutral-200">
                <span>{(image.file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button
                  type="button"
                  className="text-red-300"
                  onClick={() => handleRemoveImage(image.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-3">
        <Button type="submit" disabled={!isReadyToPublish || createPost.isPending}>
          {createPost.isPending ? '发布中…' : '发布作品'}
        </Button>
        {errorMessage && <p className="text-center text-xs text-red-300">{errorMessage}</p>}
        <p className="text-center text-xs text-neutral-500">发布即视为同意社区内容规范。</p>
      </footer>
    </form>
  );
}
