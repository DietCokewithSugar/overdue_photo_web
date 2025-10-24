import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseRouteClient } from '@/lib/supabase';
import { requireSession } from '@/server/auth';
import { failure, success } from '@/server/http';
import { changePasswordSchema } from '@/server/profile/schema';
import { BadRequestError, UnauthorizedError, InternalServerError } from '@/server/errors';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? '密码格式不正确';
      return NextResponse.json(
        { error: { message, status: 422 } },
        { status: 422 }
      );
    }

    const email = session.user.email;
    if (!email) {
      throw new BadRequestError('当前账号缺少邮箱信息，无法修改密码');
    }

    const supabase = createSupabaseRouteClient();
    const verify = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.currentPassword
    });

    if (verify.error) {
      throw new UnauthorizedError('当前密码不正确');
    }

    const update = await supabase.auth.updateUser({
      password: parsed.data.newPassword
    });

    if (update.error) {
      throw new InternalServerError(update.error.message);
    }

    return success({ message: '密码已更新' });
  } catch (error) {
    return failure(error);
  }
}
