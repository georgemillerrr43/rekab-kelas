export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('session_token');
  response.cookies.set('session_token', '', {
    path: '/',
    expires: new Date(0),
    maxAge: -1,
  });
  return response;
}
