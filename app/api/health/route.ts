import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'expired-album',
    timestamp: new Date().toISOString()
  });
}
