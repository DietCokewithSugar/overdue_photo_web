import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import {
  deleteContestEntry,
  updateContestEntry
} from '@/server/contest-entries/service';
import { updateContestEntryInputSchema } from '@/server/contest-entries/schema';
import { failure, noContent, success } from '@/server/http';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ entryId: string }> }
) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const input = updateContestEntryInputSchema.parse(body);
    const { entryId } = await context.params;
    const entry = await updateContestEntry(entryId, session.user.id, input);
    return success(entry);
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ entryId: string }> }
) {
  try {
    const session = await requireSession();
    const { entryId } = await context.params;
    await deleteContestEntry(entryId, session.user.id);
    return noContent();
  } catch (error) {
    return failure(error);
  }
}
