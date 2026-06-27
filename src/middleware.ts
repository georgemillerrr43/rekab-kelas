import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Izinkan akses aset statis & API otentikasi tanpa validasi
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api/uploads') ||
    pathname.startsWith('/api/rekap')
  ) {
    return NextResponse.next();
  }

  // 2. Rute Publik: Laporan Rekap (siapa saja bisa akses)
  if (pathname === '/rekap' || pathname.startsWith('/rekap/')) {
    return NextResponse.next();
  }

  // 3. Baca session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let userRole: 'ADMIN' | 'SISWA' | null = null;
  if (sessionToken) {
    const rolePrefix = sessionToken.split('.')[0];
    if (rolePrefix === 'ADMIN' || rolePrefix === 'SISWA') {
      userRole = rolePrefix;
    }
  }

  // 4. Halaman Login
  if (pathname === '/login') {
    if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/', request.url));
    if (userRole === 'SISWA') return NextResponse.redirect(new URL('/siswa', request.url));
    return NextResponse.next();
  }

  // 5. Belum login → redirect ke login
  if (!userRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 6. Role SISWA: hanya boleh akses /siswa dan /api/siswa
  if (userRole === 'SISWA') {
    if (pathname.startsWith('/siswa') || pathname.startsWith('/api/siswa')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/siswa', request.url));
  }

  // 7. Role ADMIN: tidak boleh akses halaman siswa
  if (userRole === 'ADMIN') {
    if (pathname.startsWith('/siswa')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Admin boleh akses semua API kecuali /api/siswa yang hanya untuk siswa
    if (pathname.startsWith('/api/siswa')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
