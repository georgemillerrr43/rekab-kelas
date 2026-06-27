import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MONTH_MAP: Record<string, number> = {
  'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
  'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
  'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
  'june': 5
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kelas = searchParams.get('kelas');
  const bulan = searchParams.get('bulan');

  if (!kelas || !bulan) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  try {
    const parts = (bulan || '').toLowerCase().split(' ');
    const monthName = parts[0] || '';
    const year = parseInt(parts[1]) || new Date().getFullYear();
    const month = MONTH_MAP[monthName] !== undefined ? MONTH_MAP[monthName] : new Date().getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const students = await prisma.siswa.findMany({
      where: { kelasId: kelas },
      orderBy: { nis: 'asc' },
    });

    const studentIds = students.map((s) => s.id);

    const kehadiranList = await prisma.kehadiran.findMany({
      where: {
        siswaId: { in: studentIds },
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const result = students.map((siswa) => {
      const studentKhd = kehadiranList.filter((k) => k.siswaId === siswa.id);
      const hadir = studentKhd.filter((k) => k.status === 'HADIR').length;
      const izin = studentKhd.filter((k) => k.status === 'IZIN').length;
      const sakit = studentKhd.filter((k) => k.status === 'SAKIT').length;
      const alpa = studentKhd.filter((k) => k.status === 'ALPA').length;
      const totalHari = studentKhd.length;
      const persentase = totalHari > 0 ? Number(((hadir / totalHari) * 100).toFixed(1)) : 0;

      return {
        nis: siswa.nis,
        nama: siswa.nama,
        hadir,
        izin,
        sakit,
        alpa,
        totalHari,
        persentase,
      };
    });

    return NextResponse.json({ rekap: result });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
