import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseRouteClient } from '@/lib/supabase';
import { failure, success } from '@/server/http';

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json().catch(() => ({}))) as { email?: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: { message: '请输入有效的邮箱地址', status: 400 } },
        { status: 400 }
      );
    }

    const supabase = createSupabaseRouteClient();
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    const redirectTo = `${origin.replace(/\/$/, '')}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo
    });

    if (error) {
      console.error('resetPasswordForEmail error', error);
    }

    return success({ message: '请在邮箱中重设密码。' });
  } catch (error) {
    return failure(error);
  }
}
