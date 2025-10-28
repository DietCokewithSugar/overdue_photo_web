import 'server-only';

import { z } from 'zod';

export const createCommentInputSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(1000),
  parentCommentId: z.string().uuid().optional()
});

export const updateCommentInputSchema = z.object({
  body: z.string().min(1).max(1000).optional(),
  status: z.enum(['active', 'deleted', 'hidden']).optional()
});

export const listCommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional()
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>;
