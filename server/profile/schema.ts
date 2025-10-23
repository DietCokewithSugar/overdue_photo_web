import 'server-only';

import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, '昵称不能为空').max(40, '昵称过长').optional(),
  avatarUrl: z.string().url('头像地址无效').max(255).optional(),
  bio: z.string().max(200, '简介过长').optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
