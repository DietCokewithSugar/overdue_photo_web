import 'server-only';

import { z } from 'zod';

export const createSignedUploadInputSchema = z.object({
  resource: z.enum(['post-image', 'contest-poster', 'contest-entry', 'profile-avatar']),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive().max(50 * 1024 * 1024)
});

export type CreateSignedUploadInput = z.infer<typeof createSignedUploadInputSchema>;
