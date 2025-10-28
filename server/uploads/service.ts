import 'server-only';

import { randomUUID } from 'crypto';
import { extname } from 'path';

import { resolveBucket, type StorageBucketKey, getSupabaseAdminClient } from '@/lib/supabase';

import { InternalServerError } from '@/server/errors';
import {
  createSignedUploadInputSchema,
  type CreateSignedUploadInput
} from './schema';

const RESOURCE_BUCKET_MAP: Record<CreateSignedUploadInput['resource'], StorageBucketKey> = {
  'post-image': 'posts',
  'contest-poster': 'contestPosters',
  'contest-entry': 'contestEntries',
  'profile-avatar': 'avatars'
};

const inferExtension = (fileName: string, contentType: string) => {
  const currentExt = extname(fileName);

  if (currentExt) {
    return currentExt;
  }

  if (contentType.includes('jpeg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';

  return ''; // fallback to no extension
};

export const createSignedUploadUrl = async (userId: string, payload: CreateSignedUploadInput) => {
  const input = createSignedUploadInputSchema.parse(payload);
  const bucketKey = RESOURCE_BUCKET_MAP[input.resource];
  const bucketName = resolveBucket(bucketKey);
  if (!bucketName) {
    throw new InternalServerError(`未配置存储桶: ${bucketKey}`);
  }
  const extension = inferExtension(input.fileName, input.contentType);
  const objectKey = `${userId}/${Date.now()}-${randomUUID()}${extension}`;
  const storagePath = `${bucketKey}/${objectKey}`;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(objectKey);

  if (error || !data) {
    throw new InternalServerError(error?.message ?? '生成上传凭证失败');
  }

  return {
    bucket: bucketName,
    path: storagePath,
    signedUrl: data.signedUrl,
    token: data.token
  } as const;
};
