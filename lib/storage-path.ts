'use client';

const BUCKET_NAME_MAP: Record<string, string> = {
  posts:
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_POSTS ??
    process.env.NEXT_PUBLIC_SUPABASE_BUCKET_POSTS ??
    'post-images',
  contestPosters:
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_CONTEST_POSTERS ??
    process.env.NEXT_PUBLIC_SUPABASE_BUCKET_CONTEST_POSTERS ??
    'contest-posters',
  contestEntries:
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_CONTEST_ENTRIES ??
    process.env.NEXT_PUBLIC_SUPABASE_BUCKET_CONTEST_ENTRIES ??
    'contest-entries'
};

type ResizeMode = 'cover' | 'contain';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  resize?: ResizeMode;
  quality?: number;
}

export const getPublicImageUrl = (
  storagePath?: string | null,
  options?: ImageTransformOptions
) => {
  if (!storagePath) return null;
  const [bucketKey, ...rest] = storagePath.split('/');
  const objectPath = rest.join('/');

  if (!bucketKey || !objectPath) return null;

  const bucketName = BUCKET_NAME_MAP[bucketKey] ?? bucketKey;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;

  const url = new URL(
    `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucketName}/${objectPath}`
  );

  if (options?.width) url.searchParams.set('width', String(options.width));
  if (options?.height) url.searchParams.set('height', String(options.height));
  const resize = options?.resize ?? (options?.width || options?.height ? 'cover' : undefined);
  if (resize) url.searchParams.set('resize', resize);
  const quality = options?.quality ?? (options?.width || options?.height ? 80 : undefined);
  if (quality) url.searchParams.set('quality', String(quality));

  return url.toString();
};
