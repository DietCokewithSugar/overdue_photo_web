import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import { createSignedUploadUrl } from '@/server/uploads/service';
import { createSignedUploadInputSchema } from '@/server/uploads/schema';
import { failure, success } from '@/server/http';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const input = createSignedUploadInputSchema.parse(body);
    const result = await createSignedUploadUrl(session.user.id, input);
    return success(result);
  } catch (error) {
    return failure(error);
  }
}
