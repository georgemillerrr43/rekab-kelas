export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, getSession } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: session.userId } });
    if (!admin) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
    }

    await prisma.admin.update({
      where: { id: session.userId },
      data: { password: await hashPassword(newPassword) },
    });

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' });
  } catch {
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}
