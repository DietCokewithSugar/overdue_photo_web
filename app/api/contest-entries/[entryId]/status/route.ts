import { NextRequest } from 'next/server';

import { requireRole } from '@/server/auth';
import { updateContestEntryStatus } from '@/server/contest-entries/service';
import { updateContestEntryStatusSchema } from '@/server/contest-entries/schema';
import { failure, success } from '@/server/http';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ entryId: string }> }
) {
  try {
    const { session } = await requireRole('admin');
    const body = await request.json();
    const input = updateContestEntryStatusSchema.parse(body);
    const { entryId } = await context.params;
    const entry = await updateContestEntryStatus(entryId, session.user.id, input);
    return success(entry);
  } catch (error) {
    return failure(error);
  }
}
