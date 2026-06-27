import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) {
    return NextResponse.json({ isLoggedIn: false, role: null });
  }

  const rolePrefix = sessionToken.split('.')[0];
  if (rolePrefix === 'ADMIN' || rolePrefix === 'SISWA') {
    return NextResponse.json({ isLoggedIn: true, role: rolePrefix });
  }

  return NextResponse.json({ isLoggedIn: false, role: null });
}
