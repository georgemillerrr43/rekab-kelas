import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalStudents = await prisma.siswa.count();
    const pendingIzinCount = await prisma.izin.count({
      where: { statusApproval: 'PENDING' },
    });

    const todayKehadiran = await prisma.kehadiran.findMany({
      where: { tanggal: today },
    });
    const todayHadir = todayKehadiran.filter((k) => k.status === 'HADIR').length;
    const todayStats = `${todayHadir}/${totalStudents}`;

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const monthlyKehadiran = await prisma.kehadiran.findMany({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalKhd = monthlyKehadiran.length;
    const totalHadir = monthlyKehadiran.filter((k) => k.status === 'HADIR').length;
    const totalIzin = monthlyKehadiran.filter((k) => k.status === 'IZIN').length;
    const totalSakit = monthlyKehadiran.filter((k) => k.status === 'SAKIT').length;
    const totalAlpa = monthlyKehadiran.filter((k) => k.status === 'ALPA').length;

    const avgAttendance = totalKhd > 0 ? ((totalHadir / totalKhd) * 100).toFixed(1) : '100.0';

    const distribution = [
      { label: 'Hadir', value: totalKhd > 0 ? Number(((totalHadir / totalKhd) * 100).toFixed(1)) : 0, color: 'bg-emerald-500' },
      { label: 'Izin', value: totalKhd > 0 ? Number(((totalIzin / totalKhd) * 100).toFixed(1)) : 0, color: 'bg-amber-400' },
      { label: 'Sakit', value: totalKhd > 0 ? Number(((totalSakit / totalKhd) * 100).toFixed(1)) : 0, color: 'bg-sky-400' },
      { label: 'Alpa', value: totalKhd > 0 ? Number(((totalAlpa / totalKhd) * 100).toFixed(1)) : 0, color: 'bg-rose-500' },
    ];

    const absentees = await prisma.siswa.findMany({
      select: {
        nis: true,
        nama: true,
        kehadiran: {
          where: {
            status: 'ALPA',
            tanggal: { gte: startOfMonth, lte: endOfMonth },
          },
        },
      },
    });

    const topAbsentees = absentees
      .map((s) => ({
        nis: s.nis,
        nama: s.nama,
        alpa: s.kehadiran.length,
      }))
      .filter((s) => s.alpa > 0)
      .sort((a, b) => b.alpa - a.alpa)
      .slice(0, 4);

    return NextResponse.json({
      avgAttendance,
      todayStats,
      pendingIzinCount,
      totalStudents,
      topAbsentees,
      distribution,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
