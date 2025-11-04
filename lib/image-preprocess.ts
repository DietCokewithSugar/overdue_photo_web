'use client';

const HEIC_TYPES = new Set(['image/heic', 'image/heif']);

const isHeicFile = (file: File) => {
  const mime = file.type.toLowerCase();
  if (HEIC_TYPES.has(mime)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif');
};

export const normalizeImageFile = async (file: File): Promise<File> => {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.95
    });

    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!(blob instanceof Blob)) {
      throw new Error('HEIC 转换结果无效');
    }

    const baseName = file.name.replace(/\.(heic|heif)$/i, '') || 'image';
    const nextName = `${baseName}.jpg`;

    return new File([blob], nextName, {
      type: 'image/jpeg',
      lastModified: file.lastModified
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '未知错误';
    throw new Error(`HEIC 格式转换失败：${message}`);
  }
};

