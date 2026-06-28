export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const guru = await prisma.guru.findMany({
      select: { id: true, username: true, nama: true, passwordPlain: true, kelasId: true, kelas: { select: { nama: true, waliKelas: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ guru });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { username, password, nama, kelasId } = await req.json();
    if (!username || !password || !nama || !kelasId) return NextResponse.json({ error: 'Semua field wajib' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Password min 6 karakter' }, { status: 400 });
    if (await prisma.guru.findUnique({ where: { username } })) return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 400 });
    if (await prisma.guru.findUnique({ where: { kelasId } })) return NextResponse.json({ error: 'Kelas ini sudah punya guru' }, { status: 400 });
    const hashed = await hashPassword(password);
    const guru = await prisma.guru.create({
      data: { username, password: hashed, passwordPlain: password, nama, kelasId },
      select: { id: true, username: true, nama: true, passwordPlain: true, kelasId: true, kelas: { select: { nama: true } } },
    });
    return NextResponse.json({ guru }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Gagal buat guru' }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { id, username, password, nama } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    const existing = await prisma.guru.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });
    if (username && username !== existing.username) {
      if (await prisma.guru.findUnique({ where: { username } })) return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 400 });
    }
    const data: any = {};
    if (username) data.username = username;
    if (nama) data.nama = nama;
    if (password) {
      if (password.length < 6) return NextResponse.json({ error: 'Password min 6 karakter' }, { status: 400 });
      data.password = await hashPassword(password);
      data.passwordPlain = password;
    }
    const guru = await prisma.guru.update({ where: { id }, data });
    return NextResponse.json({ guru });
  } catch { return NextResponse.json({ error: 'Gagal update guru' }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    await prisma.guru.delete({ where: { id } });
    return NextResponse.json({ message: 'Guru dihapus' });
  } catch { return NextResponse.json({ error: 'Gagal hapus' }, { status: 500 }); }
}
