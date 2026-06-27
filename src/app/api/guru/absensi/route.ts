import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'GURU') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const guru = await prisma.guru.findUnique({ where: { id: session.userId }, include: { kelas: { include: { siswa: true } } } });
    if (!guru) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tanggal = new URL(req.url).searchParams.get('tanggal') || new Date().toISOString().split('T')[0];
    const siswaIds = guru.kelas.siswa.map(s => s.id);
    const kehadiranList = await prisma.kehadiran.findMany({ where: { tanggal: new Date(tanggal), siswaId: { in: siswaIds } } });
    const km = new Map(kehadiranList.map(k => [k.siswaId, k]));

    const students = guru.kelas.siswa.map(s => {
      const k = km.get(s.id);
      return { id: s.id, nis: s.nis, nama: s.nama, whatsappOrangTua: s.whatsappOrangTua, status: k?.status || 'BELUM', alasan: '' };
    });

    const alreadySubmitted = kehadiranList.length === siswaIds.length;
    return NextResponse.json({ kelas: { id: guru.kelas.id, nama: guru.kelas.nama, waliKelas: guru.kelas.waliKelas }, students, alreadySubmitted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'GURU') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const guru = await prisma.guru.findUnique({ where: { id: session.userId }, include: { kelas: { include: { siswa: { select: { id: true } } } } } });
    if (!guru) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { tanggal, data } = await req.json();
    if (!tanggal || !data) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });

    const kelasSiswaIds = new Set(guru.kelas.siswa.map(s => s.id));
    for (const item of data) {
      if (!kelasSiswaIds.has(item.siswaId)) continue;
      await prisma.kehadiran.upsert({
        where: { siswaId_tanggal: { siswaId: item.siswaId, tanggal: new Date(tanggal) } },
        update: { status: item.status },
        create: { siswaId: item.siswaId, tanggal: new Date(tanggal), status: item.status },
      });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
