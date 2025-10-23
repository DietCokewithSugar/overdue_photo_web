import { NextRequest } from 'next/server';

import { requireRole } from '@/server/auth';
import { createContest, listContests } from '@/server/contests/service';
import { createContestInputSchema } from '@/server/contests/schema';
import { created, failure, success } from '@/server/http';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor') ?? undefined;

    const status =
      statusParam === 'draft' || statusParam === 'published' || statusParam === 'closed'
        ? statusParam
        : undefined;

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : undefined;

    const contests = await listContests({ status, limit, cursor });
    return success(contests);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireRole('admin');
    const body = await request.json();
    const input = createContestInputSchema.parse(body);
    const contest = await createContest(session.user.id, input);
    return created(contest);
  } catch (error) {
    return failure(error);
  }
}
