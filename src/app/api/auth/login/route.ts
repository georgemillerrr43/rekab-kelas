import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, encryptSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan Password wajib diisi!' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    // 1. Cari di tabel Admin terlebih dahulu
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (admin && admin.password === hashedPassword) {
      // Login sukses sebagai ADMIN
      const sessionData = {
        userId: admin.id,
        username: admin.username,
        role: 'ADMIN' as const,
        nama: admin.nama,
      };

      const token = encryptSession(sessionData);
      const response = NextResponse.json({ success: true, role: 'ADMIN' });
      
      // Set secure cookie
      response.cookies.set('session_token', token, {
        httpOnly: true,
        secure: request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 hari
      });

      return response;
    }

    // 2. Jika tidak ditemukan di Admin, cari di tabel Siswa
    const siswa = await prisma.siswa.findUnique({
      where: { username },
    });

    if (siswa && siswa.password === hashedPassword) {
      // Login sukses sebagai SISWA
      const sessionData = {
        userId: siswa.id,
        username: siswa.username,
        role: 'SISWA' as const,
        nama: siswa.nama,
        nis: siswa.nis,
      };

      const token = encryptSession(sessionData);
      const response = NextResponse.json({ success: true, role: 'SISWA' });
      
      // Set secure cookie
      response.cookies.set('session_token', token, {
        httpOnly: true,
        secure: request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 hari
      });

      return response;
    }

    // 3. Login Gagal
    return NextResponse.json(
      { error: 'Username atau Password salah!' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error login API:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
