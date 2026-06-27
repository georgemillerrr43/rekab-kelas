import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const guru = await prisma.guru.findMany({
      include: { kelas: { select: { nama: true, waliKelas: true } } },
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
      data: { username, password: hashed, nama, kelasId },
      include: { kelas: { select: { nama: true } } },
    });
    return NextResponse.json({ guru }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Gagal buat guru' }, { status: 500 }); }
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
