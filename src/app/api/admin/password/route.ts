export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, getSession } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    let user: { id: string; password: string } | null = null;

    if (session.role === 'ADMIN') {
      user = await prisma.admin.findUnique({ where: { id: session.userId } });
    } else if (session.role === 'GURU') {
      user = await prisma.guru.findUnique({ where: { id: session.userId } });
    } else if (session.role === 'SISWA') {
      user = await prisma.siswa.findUnique({ where: { id: session.userId } });
    }

    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);

    if (session.role === 'ADMIN') {
      await prisma.admin.update({ where: { id: session.userId }, data: { password: hashed } });
    } else if (session.role === 'GURU') {
      await prisma.guru.update({ where: { id: session.userId }, data: { password: hashed, passwordPlain: newPassword } });
    } else if (session.role === 'SISWA') {
      await prisma.siswa.update({ where: { id: session.userId }, data: { password: hashed, passwordPlain: newPassword } });
    }

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' });
  } catch {
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}
