import 'server-only';

import { z } from 'zod';

const entryImageSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailPath: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sortOrder: z.number().int().nonnegative().default(0)
});

export const createContestEntryInputSchema = z
  .object({
    contestId: z.string().uuid(),
    entryType: z.enum(['single', 'collection']),
    title: z.string().min(1).max(140),
    description: z.string().max(4000).optional(),
    images: z.array(entryImageSchema).min(1)
  })
  .superRefine((value, ctx) => {
    if (value.entryType === 'single' && value.images.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '单张投稿必须上传且仅上传 1 张图片',
        path: ['images']
      });
    }

    if (value.entryType === 'collection') {
      if (!value.description) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '图集投稿需要填写描述',
          path: ['description']
        });
      }

      if (value.images.length < 2 || value.images.length > 9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '图集投稿的图片数量须在 2-9 张之间',
          path: ['images']
        });
      }
    }
  });

export const updateContestEntryInputSchema = createContestEntryInputSchema
  .omit({ entryType: true, contestId: true })
  .partial();

export const updateContestEntryStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  notes: z.string().max(2000).optional()
});

export type CreateContestEntryInput = z.infer<typeof createContestEntryInputSchema>;
export type UpdateContestEntryInput = z.infer<typeof updateContestEntryInputSchema>;
