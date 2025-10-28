import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/auth';
import { failure, success } from '@/server/http';
import { listUsersSchema } from '@/server/admin/users/schema';
import { listUsers } from '@/server/admin/users/service';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const parsed = listUsersSchema.safeParse({
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      role: searchParams.get('role') ?? undefined
    });

    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? '参数不合法';
      return NextResponse.json(
        { error: { message, status: 422 } },
        { status: 422 }
      );
    }

    const data = await listUsers(parsed.data);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}
