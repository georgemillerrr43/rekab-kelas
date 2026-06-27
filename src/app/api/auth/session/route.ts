import { NextRequest, NextResponse } from 'next/server';
import { decryptSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) {
    return NextResponse.json({ isLoggedIn: false, role: null });
  }

  const session = decryptSession(sessionToken);
  if (session) {
    return NextResponse.json({ isLoggedIn: true, role: session.role, nama: session.nama });
  }

  return NextResponse.json({ isLoggedIn: false, role: null });
}
