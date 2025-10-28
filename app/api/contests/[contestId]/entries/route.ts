import { NextRequest } from 'next/server';

import { requireRole, requireSession } from '@/server/auth';
import {
  createContestEntry,
  listContestEntries
} from '@/server/contest-entries/service';
import { createContestEntryInputSchema } from '@/server/contest-entries/schema';
import { created, failure, success } from '@/server/http';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contestId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor') ?? undefined;
    const statusParam = searchParams.get('status');
    const mine = searchParams.get('mine') === 'true';

    let status: 'pending' | 'approved' | 'rejected' | undefined;
    if (statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected') {
      status = statusParam;
    }

    let authorId: string | undefined;

    if (mine) {
      const session = await requireSession();
      authorId = session.user.id;
    }

    if (status && status !== 'approved' && !mine) {
      await requireRole('admin');
    }

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : undefined;

    const { contestId } = await context.params;
    const entries = await listContestEntries(contestId, {
      limit,
      cursor,
      status: mine ? status : status ?? 'approved',
      authorId
    });

    return success(entries);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ contestId: string }> }
) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { contestId } = await context.params;
    const input = createContestEntryInputSchema.parse({ ...body, contestId });
    const entry = await createContestEntry(session.user.id, input);
    return created(entry);
  } catch (error) {
    return failure(error);
  }
}
