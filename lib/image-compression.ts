'use client';

import encodeJpeg, { init as initJpeg } from '@jsquash/jpeg/encode';
import encodeWebp, { init as initWebp } from '@jsquash/webp/encode';
import resize, { initResize } from '@jsquash/resize';

export interface CompressOptions {
  maxWidthOrHeight: number;
  quality?: number;
  preferWebp?: boolean;
  maxFileSizeBytes?: number;
  minQuality?: number;
}

let wasmReady: Promise<void> | null = null;

const ensureWasmReady = () => {
  if (!wasmReady) {
    wasmReady = Promise.allSettled([initJpeg(), initWebp(), initResize()]).then((results) => {
      const rejected = results.find((result) => result.status === 'rejected');
      if (rejected && rejected.status === 'rejected') {
        throw rejected.reason;
      }
    });
  }
  return wasmReady;
};

const loadHtmlImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

const create2dContext = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('无法获取 Canvas 2D 上下文');
  return { canvas, ctx };
};

const decodeToImageData = async (file: File): Promise<ImageData> => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const { ctx } = create2dContext(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close?.();
    return data;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadHtmlImage(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const { ctx } = create2dContext(width, height);
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, width, height);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const computeTargetSize = (width: number, height: number, maxSide: number) => {
  if (!maxSide || maxSide <= 0) return { width, height };
  const largestSide = Math.max(width, height);
  if (largestSide <= maxSide) return { width, height };
  const scale = maxSide / largestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
};

const normaliseQuality = (quality?: number, fallback = 75) => {
  if (typeof quality !== 'number' || Number.isNaN(quality)) return fallback;
  return Math.min(100, Math.max(10, Math.round(quality)));
};

const normaliseName = (name: string, mimeType: string) => {
  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const lastDot = name.lastIndexOf('.');
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  return `${base}.${extension}`;
};

export const compressImageAdvanced = async (file: File, options: CompressOptions): Promise<File> => {
  await ensureWasmReady();

  let imageData = await decodeToImageData(file);
  const targetSize = computeTargetSize(
    imageData.width,
    imageData.height,
    options.maxWidthOrHeight
  );

  if (imageData.width !== targetSize.width || imageData.height !== targetSize.height) {
    imageData = await resize(imageData, {
      width: targetSize.width,
      height: targetSize.height,
      method: 'lanczos3',
      premultiply: true,
      linearRGB: true
    });
  }

  const quality = normaliseQuality(options.quality);
  const minQuality = normaliseQuality(options.minQuality, 40);
  const prefersWebp = options.preferWebp ?? file.type === 'image/webp';
  const outputMime = prefersWebp ? 'image/webp' : 'image/jpeg';

  const candidateQualities: number[] = [quality];
  if (options.maxFileSizeBytes) {
    for (let q = quality - 10; q >= minQuality; q -= 10) {
      candidateQualities.push(q);
    }
    if (!candidateQualities.includes(minQuality)) {
      candidateQualities.push(minQuality);
    }
  }

  let encodedBuffer: ArrayBuffer | null = null;
  for (const candidate of candidateQualities) {
    const buffer =
      outputMime === 'image/webp'
        ? await encodeWebp(imageData, { quality: candidate })
        : await encodeJpeg(imageData, { quality: candidate });

    encodedBuffer = buffer;

    if (!options.maxFileSizeBytes || buffer.byteLength <= options.maxFileSizeBytes) {
      break;
    }
  }

  if (!encodedBuffer) {
    throw new Error('图像编码失败');
  }

  if (options.maxFileSizeBytes && encodedBuffer.byteLength > options.maxFileSizeBytes) {
    throw new Error('压缩后的图像仍超过限制');
  }

  const blob = new Blob([encodedBuffer], { type: outputMime });
  const filename = normaliseName(file.name, outputMime);

  return new File([blob], filename, { type: outputMime, lastModified: file.lastModified });
};
