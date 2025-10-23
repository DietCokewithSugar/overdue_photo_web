import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/auth';
import { failure, success } from '@/server/http';
import { updateUserRoleSchema } from '@/server/admin/users/schema';
import { updateUserRole } from '@/server/admin/users/service';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const parsed = updateUserRoleSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? '参数不合法';
      return NextResponse.json(
        { error: { message, status: 422 } },
        { status: 422 }
      );
    }

    const { userId } = await context.params;
    const updated = await updateUserRole(userId, parsed.data);
    return success(updated);
  } catch (error) {
    return failure(error);
  }
}
