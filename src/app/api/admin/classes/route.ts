export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const kelas = await prisma.kelas.findMany({
      include: {
        _count: {
          select: { siswa: true }
        }
      },
      orderBy: { nama: 'asc' }
    });

    return NextResponse.json({ kelas });
  } catch (error) {
    console.error('GET /api/admin/classes:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await req.json();
    const { nama, waliKelas, guruUsername, guruPassword } = body;

    if (!nama || !waliKelas) {
      return NextResponse.json({ error: 'Nama kelas dan nama wali kelas harus diisi' }, { status: 400 });
    }

    const existing = await prisma.kelas.findUnique({ where: { nama } });
    if (existing) {
      return NextResponse.json({ error: 'Kelas dengan nama ini sudah ada' }, { status: 400 });
    }

    const newKelas = await prisma.kelas.create({ data: { nama, waliKelas } });

    if (guruUsername && guruPassword) {
      if (guruPassword.length < 6) {
        return NextResponse.json({ error: 'Password guru minimal 6 karakter' }, { status: 400 });
      }
      const existingGuru = await prisma.guru.findUnique({ where: { username: guruUsername } });
      if (existingGuru) {
        return NextResponse.json({ error: 'Username guru sudah digunakan' }, { status: 400 });
      }
      const hashed = await hashPassword(guruPassword);
      await prisma.guru.create({
        data: { username: guruUsername, password: hashed, passwordPlain: guruPassword, nama: waliKelas, kelasId: newKelas.id },
      });
    }

    return NextResponse.json({ kelas: newKelas }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/classes:', error);
    return NextResponse.json({ error: 'Gagal membuat kelas' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await req.json();
    const { id, nama, waliKelas } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID kelas harus disediakan' }, { status: 400 });
    }

    const existing = await prisma.kelas.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    if (nama && nama !== existing.nama) {
      const duplicate = await prisma.kelas.findUnique({ where: { nama } });
      if (duplicate) {
        return NextResponse.json({ error: 'Kelas dengan nama ini sudah ada' }, { status: 400 });
      }
    }

    const updated = await prisma.kelas.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(waliKelas && { waliKelas }),
      },
    });

    return NextResponse.json({ kelas: updated });
  } catch (error) {
    console.error('PUT /api/admin/classes:', error);
    return NextResponse.json({ error: 'Gagal mengupdate kelas' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kelas harus disediakan' }, { status: 400 });
    }

    const kelas = await prisma.kelas.findUnique({ where: { id } });

    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    await prisma.kelas.delete({ where: { id } });

    return NextResponse.json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/admin/classes:', error);
    return NextResponse.json({ error: 'Gagal menghapus kelas' }, { status: 500 });
  }
}
