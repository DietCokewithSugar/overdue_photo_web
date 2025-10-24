import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseAdminClient, STORAGE_BUCKETS } from '@/lib/supabase';

const bucketNameFrom = (bucketOrKey: string) =>
  (STORAGE_BUCKETS as Record<string, string>)[bucketOrKey] ?? bucketOrKey;

export async function GET(request: NextRequest) {
  try {
    const bucket = request.nextUrl.searchParams.get('bucket');
    const path = request.nextUrl.searchParams.get('path');

    if (!bucket || !path) {
      return NextResponse.json({ error: { message: '缺少 bucket 或 path 参数' } }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const bucketName = bucketNameFrom(bucket);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: { message: error?.message ?? '生成图片访问链接失败' } },
        { status: 500 }
      );
    }

    return NextResponse.redirect(data.signedUrl, {
      status: 302
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : '内部错误' } },
      { status: 500 }
    );
  }
}
