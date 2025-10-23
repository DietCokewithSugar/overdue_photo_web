import 'server-only';

import { z } from 'zod';

export const createContestInputSchema = z
  .object({
    title: z.string().min(1).max(140),
    slug: z
      .string()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'slug 仅能包含小写字母、数字与连字符'),
    description: z.string().max(8000).optional(),
    posterPath: z.string().min(1),
    submissionStartsAt: z.string().datetime(),
    submissionEndsAt: z.string().datetime(),
    singleSubmissionLimit: z.number().int().min(0).max(100).default(0),
    collectionSubmissionLimit: z.number().int().min(0).max(100).default(0),
    singleFileSizeLimitMb: z.number().int().min(1).max(100).default(20),
    status: z.enum(['draft', 'published', 'closed']).default('draft')
  })
  .refine(
    (value) => new Date(value.submissionEndsAt) > new Date(value.submissionStartsAt),
    {
      message: '比赛截止时间必须晚于开始时间',
      path: ['submissionEndsAt']
    }
  );

export const updateContestInputSchema = createContestInputSchema.partial();

export type CreateContestInput = z.infer<typeof createContestInputSchema>;
export type UpdateContestInput = z.infer<typeof updateContestInputSchema>;
