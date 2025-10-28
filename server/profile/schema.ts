import 'server-only';

import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, '昵称不能为空').max(40, '昵称过长').optional(),
  avatarUrl: z.string().max(255).optional(),
  bio: z.string().max(200, '简介过长').optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, '当前密码至少需要 8 位字符'),
    newPassword: z.string().min(8, '新密码至少需要 8 位字符')
  })
  .refine(
    ({ currentPassword, newPassword }) => currentPassword !== newPassword,
    {
      message: '新密码不能与当前密码相同',
      path: ['newPassword']
    }
  );
