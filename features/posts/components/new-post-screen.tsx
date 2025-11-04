'use client';

import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useCreatePostMutation } from '@/features/posts/hooks';
import { requestSignedUpload } from '@/features/uploads/api';
import { uploadToSignedUrl } from '@/features/uploads/upload';
import { consumePendingNewPostFiles } from '@/features/posts/state/new-post-selection';

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'uploading' | 'uploaded' | 'error';
  storagePath?: string;
}

type Step = 'editing' | 'success';

// 支持的图片格式
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
// 最多上传照片数量
const MAX_IMAGES = 9;

// 验证文件格式是否为支持的格式
const isValidImageFormat = (file: File): boolean => {
  // 检查 MIME 类型
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return true;
  }
  
  // 检查文件扩展名（作为备用验证）
  const fileName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

export function NewPostScreen() {
  const [step, setStep] = useState<Step>('editing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const createPost = useCreatePostMutation();

  const hasImages = images.length > 0;
  const isUploading = images.some((image) => image.status === 'uploading');
  const hasErrors = images.some((image) => image.status === 'error');
  const isReadyToPublish =
    hasImages &&
    !isUploading &&
    !hasErrors &&
    title.trim().length > 0 &&
    images.every((image) => image.status === 'uploaded');

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    setErrorMessage(null);
    
    // 检查照片数量限制
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`最多只能上传 ${MAX_IMAGES} 张照片，请先删除部分照片后再上传。`);
      return;
    }
    
    // 如果新选择的照片数量超过剩余数量，只处理前 N 张
    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setErrorMessage(`最多只能上传 ${MAX_IMAGES} 张照片，已自动选择前 ${remainingSlots} 张。`);
    }
    
    // 验证文件格式
    const invalidFiles = filesToProcess.filter((file) => !isValidImageFormat(file));
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((f) => f.name).join('、');
      setErrorMessage(`不支持的文件格式：${invalidFileNames}。请上传 JPG 或 PNG 格式的图片。`);
      return;
    }
    
    const { compressImageAdvanced } = await import('@/lib/image-compression');

    const results = await Promise.allSettled(
      filesToProcess.map((file) =>
        compressImageAdvanced(file, {
          maxWidthOrHeight: 2048,
          quality: 80,
          minQuality: 40,
          preferWebp: file.type === 'image/webp' || file.type === 'image/png',
          maxFileSizeBytes: 4 * 1024 * 1024
        })
      )
    );

    const succeeded = results.filter(
      (result): result is PromiseFulfilledResult<File> => result.status === 'fulfilled'
    );

    const failed = results.length - succeeded.length;
    if (!succeeded.length) {
      setErrorMessage('未能处理所选图片，请检查文件大小或格式后重试。');
      return;
    }

    if (failed > 0) {
      console.warn(`压缩失败的图片数量：${failed}`);
      setErrorMessage('部分图片未能处理成功，请重新选择或减小文件大小。');
    }

    const compressedFiles = succeeded.map((result) => result.value);

    const placeholders: LocalImage[] = compressedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading'
    }));

    setImages((prev) => [...prev, ...placeholders]);

    for (const placeholder of placeholders) {
      try {
        const { path, signedUrl } = await requestSignedUpload({
          resource: 'post-image',
          fileName: placeholder.file.name,
          contentType: placeholder.file.type,
          fileSize: placeholder.file.size
        });

        await uploadToSignedUrl(signedUrl, placeholder.file);

        setImages((prev) =>
          prev.map((image) =>
            image.id === placeholder.id
              ? { ...image, status: 'uploaded', storagePath: path }
              : image
          )
        );
      } catch (error) {
        console.error(error);
        setImages((prev) =>
          prev.map((image) =>
            image.id === placeholder.id ? { ...image, status: 'error' } : image
          )
        );
        setErrorMessage('部分照片上传失败，请检查网络后重试。');
      }
    }
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;
    await processFiles(Array.from(fileList));
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // 如果已达到最大数量，不允许拖拽
    if (images.length >= MAX_IMAGES) {
      return;
    }
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // 只有当离开的是拖拽区域本身时才设置为 false
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    // 如果已达到最大数量，不允许拖拽上传
    if (images.length >= MAX_IMAGES) {
      setErrorMessage(`最多只能上传 ${MAX_IMAGES} 张照片，请先删除部分照片后再上传。`);
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  useEffect(() => {
    const pendingFiles = consumePendingNewPostFiles();
    if (pendingFiles.length) {
      void processFiles(pendingFiles);
    }
  }, []);

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReadyToPublish) return;

    try {
      setErrorMessage(null);
      const payloadImages = images.map((image, index) => ({
        storagePath: image.storagePath!,
        sortOrder: index
      }));

      await createPost.mutateAsync({
        title: title.trim(),
        contentPlaintext: description.trim() || undefined,
        status: 'published',
        images: payloadImages
      });

      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setImages([]);
      setTitle('');
      setDescription('');
      setStep('success');
    } catch (error) {
      console.error(error);
      setErrorMessage('发布失败，请稍后重试。');
    }
  };

  const totalSize = useMemo(() => {
    if (!images.length) return 0;
    return images.reduce((acc, image) => acc + image.file.size, 0) / 1024 / 1024;
  }, [images]);

  if (step === 'success') {
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5 rounded-[28px] bg-neutral-100 px-6 py-10 text-center text-neutral-700">
        <h1 className="text-2xl font-semibold">发布成功！</h1>
        <p className="text-sm text-neutral-500">正在跳转到主页…</p>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-8 pb-36" onSubmit={handleSubmit}>
      <section className="space-y-4 px-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-900">发布新作品</h1>
          <p className="text-sm text-neutral-500">先挑选照片，系统会自动处理尺寸并提前上传。</p>
        </div>

        <div className="flex flex-col gap-4 rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50 px-5 py-5">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>{hasImages ? `已选择 ${images.length}/${MAX_IMAGES} 张照片` : '暂未选择照片'}</span>
            <span className="text-xs text-neutral-400">合计 {totalSize.toFixed(2)} MB</span>
          </div>

          <label
            className={`flex h-36 flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed bg-white text-sm transition ${
              images.length >= MAX_IMAGES
                ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400'
                : isDragging
                  ? 'cursor-pointer border-neutral-500 bg-neutral-100 text-neutral-700'
                  : 'cursor-pointer border-neutral-300 text-neutral-500 hover:border-neutral-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {images.length >= MAX_IMAGES
              ? `已达到最大数量（${MAX_IMAGES} 张）`
              : isDragging
                ? '松开鼠标上传照片'
                : '点击或拖拽图片到此处'}
            <input
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={handleImageChange}
              disabled={images.length >= MAX_IMAGES}
            />
          </label>

          {hasImages ? (
            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500">
              {images.map((image) => (
                <div key={image.id} className="relative overflow-hidden rounded-[18px] bg-neutral-200">
                  <img src={image.previewUrl} alt="预览" className="h-32 w-full object-cover" />

                  {image.status !== 'uploaded' && (
                    <div className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                      image.status === 'uploading'
                        ? 'bg-black/40 text-white'
                        : 'bg-red-500/70 text-white'
                    }`}
                    >
                      {image.status === 'uploading' ? '上传中…' : '上传失败'}
                    </div>
                  )}

                  <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      aria-label="删除图片"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {hasImages ? (
        <section className="space-y-4 px-5">
          <div className="flex flex-col gap-3 rounded-[24px] border border-neutral-200 bg-white px-5 py-5">
            <label className="flex flex-col gap-2 text-sm text-neutral-600">
              作品标题
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="给作品取个醒目的标题"
                className="rounded-[18px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-neutral-600">
              作品描述（可选）
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="分享创作背后的故事或拍摄灵感。"
                className="rounded-[18px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        </section>
      ) : null}

      <footer className="flex flex-col gap-3 px-5">
        <Button
          type="submit"
          disabled={!isReadyToPublish || createPost.isPending}
          className="rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {createPost.isPending ? '发布中…' : '发布作品'}
        </Button>
        {errorMessage && <p className="text-center text-xs text-red-500">{errorMessage}</p>}
        <p className="text-center text-xs text-neutral-400">发布即视为同意社区内容规范。</p>
      </footer>
    </form>
  );
}
