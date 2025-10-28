import 'server-only';

import { z } from 'zod';

import type { Database } from '@/types/database';

export const POST_STATUS = ['draft', 'published', 'archived'] as const satisfies readonly Database['public']['Enums']['post_status'][];
export const COMMENT_STATUS = ['active', 'deleted', 'hidden'] as const;

export const postImageInputSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailPath: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurhash: z.string().optional(),
<<<<<<< HEAD
  sortOrder: z.number().int().nonnegative().optional()
=======
  sortOrder: z.number().int().nonnegative().default(0)
>>>>>>> a2fa80735b3d417c7cf8f31ee712e08f186fc57c
});

export const createPostInputSchema = z.object({
  title: z.string().min(1).max(120),
  contentRichtext: z.record(z.string(), z.any()).optional(),
  contentPlaintext: z.string().max(10000).optional(),
  images: z.array(postImageInputSchema).min(1, '至少上传一张图片'),
  status: z.enum(POST_STATUS).default('published'),
  publishedAt: z.string().datetime().optional()
});

export const updatePostInputSchema = createPostInputSchema.partial().extend({
  isFeatured: z.boolean().optional()
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;
export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;
