import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'GURU') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const guru = await prisma.guru.findUnique({
      where: { id: session.userId },
      include: { kelas: { include: { siswa: { select: { id: true } } } } },
    });
    if (!guru) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const siswaIds = guru.kelas.siswa.map(s => s.id);
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const kehadiran = await prisma.kehadiran.findMany({
      where: { siswaId: { in: siswaIds }, tanggal: { gte: startMonth, lte: endMonth } },
    });

    const stats = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    for (const k of kehadiran) {
      if (k.status === 'HADIR') stats.hadir++;
      else if (k.status === 'IZIN') stats.izin++;
      else if (k.status === 'SAKIT') stats.sakit++;
      else if (k.status === 'ALPA') stats.alpa++;
    }

    const totalDays = new Set(kehadiran.map(k => k.tanggal.toISOString())).size || 1;
    const avgAttendance = siswaIds.length > 0 ? ((stats.hadir / (siswaIds.length * totalDays)) * 100).toFixed(1) : '0';

    return NextResponse.json({ avgAttendance, totalStudents: siswaIds.length, stats, totalDays, kelasNama: guru.kelas.nama });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
