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
    pathname === '/favicon.svg' ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api/uploads') ||
    pathname.startsWith('/api/rekap') ||
    pathname.startsWith('/api/kelas')
  ) {
    return NextResponse.next();
  }

  // 2. Rute Publik: Laporan Rekap (siapa saja bisa akses)
  if (pathname === '/rekap' || pathname.startsWith('/rekap/')) {
    return NextResponse.next();
  }

  // 3. Rute publik tanpa login
  const publicRoutes = ['/rekap', '/rekap/public', '/rekap/public/'];
  if (publicRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  // 4. Baca session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let userRole: 'ADMIN' | 'GURU' | 'SISWA' | null = null;
  if (sessionToken) {
    const rolePrefix = sessionToken.split('.')[0];
    if (rolePrefix === 'ADMIN' || rolePrefix === 'GURU' || rolePrefix === 'SISWA') {
      userRole = rolePrefix;
    }
  }

  // 5. Halaman Login
  if (pathname === '/login') {
    if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/', request.url));
    if (userRole === 'GURU') return NextResponse.redirect(new URL('/guru', request.url));
    if (userRole === 'SISWA') return NextResponse.redirect(new URL('/siswa', request.url));
    return NextResponse.next();
  }

  // 6. Belum login → redirect ke login
  if (!userRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 7. Role SISWA: hanya boleh akses /siswa dan /api/siswa
  if (userRole === 'SISWA') {
    if (pathname.startsWith('/siswa') || pathname.startsWith('/api/siswa')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/siswa', request.url));
  }

  // 8. Role GURU: hanya boleh akses /guru dan /api/guru
  if (userRole === 'GURU') {
    if (pathname.startsWith('/guru') || pathname.startsWith('/api/guru')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/guru', request.url));
  }

  // 9. Role ADMIN: boleh akses semuanya kecuali halaman siswa/guru
  if (userRole === 'ADMIN') {
    if (pathname.startsWith('/siswa') || pathname.startsWith('/guru')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/api/siswa') || pathname.startsWith('/api/guru')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
