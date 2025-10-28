import { NextRequest } from 'next/server';

import { requireRole } from '@/server/auth';
import { getContestById, updateContest } from '@/server/contests/service';
import { updateContestInputSchema } from '@/server/contests/schema';
import { failure, success } from '@/server/http';

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ contestId: string }> }
) {
  try {
    const { contestId } = await context.params;
    const contest = await getContestById(contestId);
    return success(contest);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ contestId: string }> }
) {
  try {
    const { session } = await requireRole('admin');
    const body = await request.json();
    const input = updateContestInputSchema.parse(body);
    const { contestId } = await context.params;
    const contest = await updateContest(contestId, session.user.id, input);
    return success(contest);
  } catch (error) {
    return failure(error);
  }
}
