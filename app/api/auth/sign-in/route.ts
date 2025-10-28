import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseRouteClient } from '@/lib/supabase';
import { failure, success } from '@/server/http';
import { signInSchema } from '@/server/auth/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? '登录信息不合法';
      return NextResponse.json(
        { error: { message, status: 422 } },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = createSupabaseRouteClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const status =
        typeof error === 'object' && error && 'status' in error
          ? (error as { status?: number }).status ?? 400
          : 400;
      return NextResponse.json(
        { error: { message: error.message, status } },
        { status }
      );
    }

    return success({
      user: data.user,
      session: data.session
    });
  } catch (error) {
    return failure(error);
  }
}
