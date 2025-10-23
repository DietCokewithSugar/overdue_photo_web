import 'server-only';

import { z } from 'zod';

export const listUsersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  role: z.enum(['user', 'admin']).optional()
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin'])
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
