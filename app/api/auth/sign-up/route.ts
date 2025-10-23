import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseRouteClient, getSupabaseAdminClient } from '@/lib/supabase';
import { failure, success } from '@/server/http';
import { signUpSchema } from '@/server/auth/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? '注册信息不合法';
      return NextResponse.json(
        { error: { message, status: 422 } },
        { status: 422 }
      );
    }

    const { email, password, displayName } = parsed.data;

    const supabase = createSupabaseRouteClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
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

    if (data.user) {
      const admin = getSupabaseAdminClient();
      await admin
        .from('profiles')
        .upsert({
          id: data.user.id,
          display_name: displayName
        })
        .select()
        .single();
    }

    return success({
      user: data.user,
      session: data.session,
      requiresEmailConfirmation: !data.session
    });
  } catch (error) {
    return failure(error);
  }
}
