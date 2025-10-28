import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

const ADMIN_PATH_PREFIXES = ['/admin', '/api/admin'];

const getPublicEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  return { url, anonKey };
};

const isAdminRoute = (pathname: string) =>
  ADMIN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export async function middleware(request: NextRequest) {
  if (!isAdminRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const { url, anonKey } = getPublicEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      get: (name) => request.cookies.get(name)?.value,
      set: (name, value, options) => {
        response.cookies.set({ name, value, ...options });
      },
      remove: (name, options) => {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      }
    }
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: { message: '未登录', status: 401 } }, { status: 401 });
    }

    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || profile?.role !== 'admin') {
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: { message: '缺少管理员权限', status: 403 } }, { status: 403 });
    }

    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
