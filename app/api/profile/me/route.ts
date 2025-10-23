import { NextRequest, NextResponse } from 'next/server';

import { requireSession } from '@/server/auth';
import { failure, success } from '@/server/http';
import { updateProfileSchema } from '@/server/profile/schema';
import { getProfileById, updateProfile } from '@/server/profile/service';

export async function GET() {
  try {
    const session = await requireSession();
    const profile = await getProfileById(session.user.id);
    return success(profile);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? '资料信息不合法';
      return NextResponse.json(
        { error: { message, status: 422 } },
        { status: 422 }
      );
    }

    const profile = await updateProfile(session.user.id, parsed.data);
    return success(profile);
  } catch (error) {
    return failure(error);
  }
}
