export const dynamic = 'force-dynamic';
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
    return NextResponse.json({ error: 'Parameter kelas dan bulan wajib diisi.' }, { status: 400 });
  }

  try {
    const parts = (bulan || '').toLowerCase().split(' ');
    const monthName = parts[0] || '';
    const year = parseInt(parts[1]) || new Date().getFullYear();
    const month = MONTH_MAP[monthName] !== undefined ? MONTH_MAP[monthName] : new Date().getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    let kelasRecord = await prisma.kelas.findFirst({
      where: { OR: [{ id: kelas }, { nama: kelas }] },
    });
    if (!kelasRecord) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    const students = await prisma.siswa.findMany({
      where: { kelasId: kelasRecord.id },
      select: { id: true },
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
      select: { tanggal: true },
    });

    const filledDates = new Set<string>();
    kehadiranList.forEach((k) => {
      const d = k.tanggal;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      filledDates.add(`${yyyy}-${mm}-${dd}`);
    });

    return NextResponse.json({ filledDates: Array.from(filledDates) });
  } catch (error) {
    console.error('Error fetching monthly daily status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
