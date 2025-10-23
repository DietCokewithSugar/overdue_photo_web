import { NextResponse } from 'next/server';

import { HttpError } from './errors';

type Serializable = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export const success = <T extends Serializable>(data: T, init?: ResponseInit) =>
  NextResponse.json({ data }, { status: 200, ...init });

export const created = <T extends Serializable>(data: T, init?: ResponseInit) =>
  NextResponse.json({ data }, { status: 201, ...init });

export const noContent = () => new NextResponse(null, { status: 204 });

export const failure = (error: unknown) => {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: { message: error.message, status: error.status } },
      { status: error.status }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { message: '服务器内部错误', status: 500 } },
    { status: 500 }
  );
};
