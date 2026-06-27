import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptSession, verifyPassword } from '@/lib/auth';

// Simple in-memory rate limiting store
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt || now > attempt.resetTime) {
    // Reset or first attempt
    loginAttempts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 min window
    return { allowed: true };
  }

  if (attempt.count >= 5) {
    const secondsLeft = Math.ceil((attempt.resetTime - now) / 1000);
    return {
      allowed: false,
      message: `Terlalu banyak percobaan login. Coba lagi dalam ${secondsLeft} detik.`,
    };
  }

  attempt.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Apply rate limiting
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan Password wajib diisi!' },
        { status: 400 }
      );
    }

    // Validate input format
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: 'Username harus 3-50 karakter.' },
        { status: 400 }
      );
    }

    if (password.length < 6 || password.length > 100) {
      return NextResponse.json(
        { error: 'Password harus 6-100 karakter.' },
        { status: 400 }
      );
    }

    const isSecure = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';

    // 1. Cari di tabel Admin
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (admin && await verifyPassword(password, admin.password)) {
      loginAttempts.delete(ip);
      const sessionData = { userId: admin.id, username: admin.username, role: 'ADMIN' as const, nama: admin.nama };
      const token = encryptSession(sessionData);
      const response = NextResponse.json({ success: true, role: 'ADMIN' });
      response.cookies.set('session_token', token, { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/', maxAge: 86400 });
      return response;
    }

    // 2. Cari di tabel Guru
    const guru = await prisma.guru.findUnique({ where: { username } });
    if (guru && await verifyPassword(password, guru.password)) {
      loginAttempts.delete(ip);
      const sessionData = { userId: guru.id, username: guru.username, role: 'GURU' as const, nama: guru.nama };
      const token = encryptSession(sessionData);
      const response = NextResponse.json({ success: true, role: 'GURU' });
      response.cookies.set('session_token', token, { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/', maxAge: 86400 });
      return response;
    }

    // 3. Cari di tabel Siswa
    const siswa = await prisma.siswa.findUnique({ where: { username } });
    if (siswa && await verifyPassword(password, siswa.password)) {
      loginAttempts.delete(ip);
      const sessionData = { userId: siswa.id, username: siswa.username, role: 'SISWA' as const, nama: siswa.nama, nis: siswa.nis };
      const token = encryptSession(sessionData);
      const response = NextResponse.json({ success: true, role: 'SISWA' });
      response.cookies.set('session_token', token, { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/', maxAge: 86400 });
      return response;
    }

    // 4. Login Gagal
    return NextResponse.json({ error: 'Username atau Password salah!' }, { status: 401 });
  } catch (error: any) {
    console.error('Error login API:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
