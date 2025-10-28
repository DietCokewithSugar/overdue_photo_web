import { NextRequest } from 'next/server';

import { requireSession } from '@/server/auth';
import { failure, success } from '@/server/http';
import { listContestEntriesByAuthor } from '@/server/contest-entries/service';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor') ?? undefined;

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : undefined;

    const entries = await listContestEntriesByAuthor(session.user.id, {
      cursor,
      limit
    });

    return success(entries);
  } catch (error) {
    return failure(error);
  }
}
