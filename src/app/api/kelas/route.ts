import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const kelas = await prisma.kelas.findMany({
      include: { _count: { select: { siswa: true } } },
      orderBy: { nama: 'asc' },
    });
    return NextResponse.json({ kelas });
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data kelas' }, { status: 500 });
  }
}
